import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { WebSocket, WebSocketServer } from 'ws';
import { jwtVerify } from '../middleware/auth.js';
import { cleanupSocketSubscriptions, socketEventBus } from './shared.js';
import { isCuid } from '../utils/common.js';
import { logger } from '../utils/logger.js';
import { getAuthSession, UserAuthPayload } from '../model/auth.js';
import { verifyUserApiKey } from '../model/user.js';
import { env } from '../utils/env.js';
import { Redis } from 'ioredis';
import {
  createAIGatewayPendingLog,
  finishOpenAIResponsesGatewayLog,
  getOpenAIResponsesStreamDelta,
  openaiResponsesRequestSchema,
  resolveAIGatewayModelApiKey,
} from '../model/aiGateway.js';
import {
  createAIRouterResponsesWebSocketLog,
  isAIRouterRetryableFailure,
  resolveAIRouterResponsesWebSocketCandidates,
  type AIRouterAttemptSummary,
  type AIRouterResponsesWebSocketCandidate,
} from '../model/aiRouter.js';
import { promAIGatewayRequestCounter } from '../utils/prometheus/client.js';

const OPENAI_RESPONSES_WEBSOCKET_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_RESPONSES_WEBSOCKET_BETA = 'responses_websockets=2026-02-06';
const RESPONSES_WEBSOCKET_MAX_PAYLOAD = 1024 * 1024;

type ResponsesWebSocketProvider = 'openai' | 'custom';

type AIResponsesPath =
  | {
      kind: 'gateway';
      workspaceId: string;
      gatewayId: string;
      provider: ResponsesWebSocketProvider;
    }
  | {
      kind: 'router';
      workspaceId: string;
      routerId: string;
      provider: ResponsesWebSocketProvider;
    };

export function parseAIResponsesPath(url: string): AIResponsesPath | null {
  try {
    const pathname = new URL(url, 'http://localhost').pathname;
    const gatewayMatch = pathname.match(
      /^\/api\/ai\/([^/]+)\/([^/]+)\/(openai|custom)\/v1\/responses\/?$/
    );
    if (gatewayMatch) {
      return {
        kind: 'gateway',
        workspaceId: decodeURIComponent(gatewayMatch[1]),
        gatewayId: decodeURIComponent(gatewayMatch[2]),
        provider: gatewayMatch[3] as ResponsesWebSocketProvider,
      };
    }

    const routerMatch = pathname.match(
      /^\/api\/ai-router\/([^/]+)\/([^/]+)\/(openai|custom)\/v1\/responses\/?$/
    );

    return routerMatch
      ? {
          kind: 'router',
          workspaceId: decodeURIComponent(routerMatch[1]),
          routerId: decodeURIComponent(routerMatch[2]),
          provider: routerMatch[3] as ResponsesWebSocketProvider,
        }
      : null;
  } catch {
    return null;
  }
}

type ResponsesWebSocketTarget = {
  workspaceId: string;
  gatewayId: string;
  userId: string | null;
  upstreamUrl: string;
  modelApiKey: string;
  modelProvider: ResponsesWebSocketProvider;
  modelOverride?: string | null;
  customModelStrategy?: unknown;
  customModelInputPrice?: Parameters<
    typeof finishOpenAIResponsesGatewayLog
  >[0]['customModelInputPrice'];
  customModelOutputPrice?: Parameters<
    typeof finishOpenAIResponsesGatewayLog
  >[0]['customModelOutputPrice'];
  handshakeTimeout?: number;
  router?: {
    routerId: string;
    handshakeAttempts: AIRouterAttemptSummary[];
  };
};

type ResponsesLogState = {
  log: ReturnType<typeof createAIGatewayPendingLog>;
  modelName: string;
  input: unknown;
  startedAt: number;
  ttft: number;
  outputContent: string;
  responseId?: string;
  settled: boolean;
};

function sendResponsesWebSocketError(socket: WebSocket, error: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'error',
        error: {
          type: 'server_error',
          message: error instanceof Error ? error.message : String(error),
        },
      })
    );
  }
}

function resolveResponsesWebSocketUrl(
  provider: ResponsesWebSocketProvider,
  customBaseUrl: string | null | undefined,
  openAIBaseUrl: string
) {
  const url = new URL(
    provider === 'custom' && customBaseUrl ? customBaseUrl : openAIBaseUrl
  );
  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  else if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
    throw new Error(
      `Unsupported Responses WebSocket URL protocol: ${url.protocol}`
    );
  }

  const pathname = url.pathname.replace(/\/+$/, '');
  url.pathname = pathname.endsWith('/responses')
    ? pathname
    : `${pathname}/responses`;
  return url.toString();
}

function connectResponsesWebSocketUpstream(target: ResponsesWebSocketTarget) {
  return new Promise<WebSocket>((resolve, reject) => {
    const upstream = new WebSocket(target.upstreamUrl, {
      headers: {
        Authorization: `Bearer ${target.modelApiKey}`,
        'OpenAI-Beta': OPENAI_RESPONSES_WEBSOCKET_BETA,
      },
      handshakeTimeout: target.handshakeTimeout ?? 30_000,
    });
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      upstream.terminate();
      reject(error);
    };
    upstream.once('open', () => {
      if (settled) return;
      settled = true;
      resolve(upstream);
    });
    upstream.once('error', fail);
    upstream.once('unexpected-response', (_request, response) => {
      const error = Object.assign(
        new Error(`Upstream WebSocket rejected with ${response.statusCode}`),
        { statusCode: response.statusCode }
      );
      fail(error);
    });
    upstream.once('close', (code, reason) => {
      fail(
        new Error(
          `Upstream WebSocket closed during handshake (${code}${reason.length ? `: ${reason.toString()}` : ''})`
        )
      );
    });
  });
}

function buildAIRouterResponsesTarget(args: {
  workspaceId: string;
  userId: string;
  candidate: AIRouterResponsesWebSocketCandidate;
  openAIBaseUrl: string;
  routerId: string;
  handshakeAttempts: AIRouterAttemptSummary[];
}): ResponsesWebSocketTarget {
  const { node, modelProvider } = args.candidate;
  const gateway = node.gateway;
  const modelApiKey = gateway?.modelApiKey?.trim();
  if (!gateway || !modelApiKey) {
    throw new Error(`AI Router gateway ${node.gatewayId} has no API key`);
  }

  return {
    workspaceId: args.workspaceId,
    gatewayId: node.gatewayId,
    userId: args.userId,
    upstreamUrl: resolveResponsesWebSocketUrl(
      modelProvider,
      gateway.customModelBaseUrl,
      args.openAIBaseUrl
    ),
    modelApiKey,
    modelProvider,
    modelOverride:
      modelProvider === 'custom' && gateway.customModelName
        ? gateway.customModelName
        : node.modelOverride,
    customModelStrategy: gateway.customModelStrategy,
    customModelInputPrice: gateway.customModelInputPrice,
    customModelOutputPrice: gateway.customModelOutputPrice,
    handshakeTimeout: node.timeoutMs ?? undefined,
    router: {
      routerId: args.routerId,
      handshakeAttempts: args.handshakeAttempts,
    },
  };
}

function bridgeAIGatewayResponsesWebSocket(
  args: ResponsesWebSocketTarget & {
    downstream: WebSocket;
    upstream: WebSocket;
    trackFinalization: (finalization: Promise<void>) => void;
  }
) {
  const states = new Set<ResponsesLogState>();
  const pendingStates: ResponsesLogState[] = [];
  const statesByResponseId = new Map<string, ResponsesLogState>();

  const findState = (event: any) => {
    const responseId =
      typeof event?.response_id === 'string'
        ? event.response_id
        : typeof event?.response?.id === 'string'
          ? event.response.id
          : undefined;

    return responseId ? statesByResponseId.get(responseId) : undefined;
  };

  const finishState = (
    state: ResponsesLogState,
    result: { response?: any; error?: unknown } = {}
  ) => {
    if (state.settled) {
      return;
    }

    state.settled = true;
    states.delete(state);
    if (state.responseId) statesByResponseId.delete(state.responseId);
    const pendingIndex = pendingStates.indexOf(state);
    if (pendingIndex !== -1) pendingStates.splice(pendingIndex, 1);

    const finalization = state.log
      .then(async ({ id: logId }) => {
        const success = result.error === undefined;
        await Promise.all([
          finishOpenAIResponsesGatewayLog({
            logId,
            workspaceId: args.workspaceId,
            gatewayId: args.gatewayId,
            modelName: state.modelName,
            modelProvider: args.modelProvider,
            customModelStrategy: args.customModelStrategy,
            customModelInputPrice: args.customModelInputPrice,
            customModelOutputPrice: args.customModelOutputPrice,
            input: state.input,
            startedAt: state.startedAt,
            ttft: state.ttft,
            outputContent: state.outputContent,
            ...result,
          }),
          args.router
            ? createAIRouterResponsesWebSocketLog({
                workspaceId: args.workspaceId,
                routerId: args.router.routerId,
                gatewayId: args.gatewayId,
                gatewayLogId: logId,
                handshakeAttempts: args.router.handshakeAttempts,
                success,
                error: result.error,
                duration: Date.now() - state.startedAt,
              })
            : Promise.resolve(),
        ]);
      })
      .catch((error) => {
        logger.error('[AI Gateway] Failed to finish Responses WebSocket log', {
          error,
        });
      });
    args.trackFinalization(finalization);
  };

  const failOpenStates = (error: unknown) => {
    for (const state of [...states]) {
      finishState(state, { error });
    }
  };

  args.downstream.on('message', (data, isBinary) => {
    if (isBinary) {
      args.downstream.close(1003, 'Responses WebSocket accepts JSON text');
      return;
    }

    const message = data.toString();
    let upstreamMessage = message;
    try {
      const event = JSON.parse(message);
      if (event?.type === 'response.create') {
        if (states.size > 0) {
          sendResponsesWebSocketError(
            args.downstream,
            new Error('A response is already in progress on this WebSocket')
          );
          return;
        }

        const payload = openaiResponsesRequestSchema.safeParse(event);
        if (payload.success) {
          const modelName = args.modelOverride || payload.data.model;
          upstreamMessage = JSON.stringify({
            ...event,
            model: modelName,
          });
          const state: ResponsesLogState = {
            log: createAIGatewayPendingLog({
              workspaceId: args.workspaceId,
              gatewayId: args.gatewayId,
              modelName,
              modelProvider: args.modelProvider,
              stream: true,
              requestPayload: event,
              userId: args.userId,
            }),
            modelName,
            input: payload.data.input,
            startedAt: Date.now(),
            ttft: -1,
            outputContent: '',
            settled: false,
          };

          states.add(state);
          pendingStates.push(state);
          promAIGatewayRequestCounter.inc({
            modelProvider: args.modelProvider,
          });
        }
      }
    } catch {
      // Forward invalid JSON so OpenAI returns the canonical protocol error.
    }

    if (args.upstream.readyState === WebSocket.OPEN) {
      args.upstream.send(upstreamMessage);
    } else {
      sendResponsesWebSocketError(
        args.downstream,
        new Error('Upstream WebSocket is not connected')
      );
      args.downstream.close(1011, 'Upstream WebSocket is not connected');
    }
  });

  args.upstream.on('message', (data, isBinary) => {
    if (args.downstream.readyState === WebSocket.OPEN) {
      args.downstream.send(data, { binary: isBinary });
    }

    if (isBinary) {
      return;
    }

    try {
      const event = JSON.parse(data.toString());
      let state = findState(event);

      if (
        !state &&
        (event?.type === 'response.created' ||
          event?.type === 'response.done' ||
          event?.type === 'response.completed' ||
          event?.type === 'response.failed' ||
          event?.type === 'response.incomplete')
      ) {
        state = pendingStates.shift();
      }
      if (event?.type === 'error' && !state) {
        state = pendingStates[0];
      }

      if (state) {
        const responseId =
          typeof event?.response?.id === 'string'
            ? event.response.id
            : typeof event?.response_id === 'string'
              ? event.response_id
              : undefined;
        if (responseId) {
          state.responseId = responseId;
          statesByResponseId.set(responseId, state);
          const pendingIndex = pendingStates.indexOf(state);
          if (pendingIndex !== -1) pendingStates.splice(pendingIndex, 1);
        }
        if (state.ttft === -1) {
          state.ttft = Date.now() - state.startedAt;
        }
        state.outputContent += getOpenAIResponsesStreamDelta(event);

        const failedDone =
          event.type === 'response.done' &&
          ['failed', 'incomplete', 'cancelled'].includes(event.response?.status);

        if (
          event.type === 'response.completed' ||
          (event.type === 'response.done' && !failedDone)
        ) {
          finishState(state, { response: event.response });
        } else if (
          failedDone ||
          event.type === 'response.failed' ||
          event.type === 'response.incomplete' ||
          event.type === 'error'
        ) {
          finishState(state, {
            error:
              event.response?.error ??
              event.response?.incomplete_details ??
              event.error ??
              event,
          });
        }
      }
    } catch {
      // The frame was already forwarded byte-for-byte to the client.
    }
  });

  args.downstream.on('close', () => {
    failOpenStates(new Error('Client closed the Responses WebSocket'));
    if (args.upstream.readyState === WebSocket.OPEN) {
      args.upstream.close();
    } else if (args.upstream.readyState === WebSocket.CONNECTING) {
      args.upstream.terminate();
    }
  });
  args.upstream.on('close', () => {
    failOpenStates(new Error('Upstream closed the Responses WebSocket'));
    if (args.downstream.readyState < WebSocket.CLOSING) {
      args.downstream.close();
    }
  });
  args.upstream.on('error', (error) => {
    logger.error('[AI Gateway] Responses WebSocket upstream error', error);
    sendResponsesWebSocketError(args.downstream, error);
    failOpenStates(error);
    if (args.downstream.readyState < WebSocket.CLOSING) {
      args.downstream.close(1011, 'Upstream WebSocket error');
    }
  });
  args.downstream.on('error', (error) => {
    logger.warn('[AI Gateway] Responses WebSocket client error', error);
  });
}

export function initAIGatewayResponsesWebSocket(
  httpServer: HTTPServer,
  openAIBaseUrl = OPENAI_RESPONSES_WEBSOCKET_BASE_URL
) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: RESPONSES_WEBSOCKET_MAX_PAYLOAD,
  });
  const pendingFinalizations = new Set<Promise<void>>();
  const trackFinalization = (finalization: Promise<void>) => {
    pendingFinalizations.add(finalization);
    void finalization.finally(() => pendingFinalizations.delete(finalization));
  };

  httpServer.on('upgrade', async (request, socket, head) => {
    const path = parseAIResponsesPath(request.url ?? '');
    if (!path) {
      return;
    }

    let upstream: WebSocket | undefined;
    try {
      const requestApiKey = String(request.headers.authorization ?? '').replace(
        /^Bearer\s+/i,
        ''
      );
      let target: ResponsesWebSocketTarget | undefined;

      if (path.kind === 'gateway') {
        let resolved: Awaited<ReturnType<typeof resolveAIGatewayModelApiKey>>;
        try {
          resolved = await resolveAIGatewayModelApiKey({
            workspaceId: path.workspaceId,
            gatewayId: path.gatewayId,
            requestApiKey,
          });
        } catch (error) {
          throw Object.assign(new Error('Unauthorized'), {
            statusCode: 401,
            cause: error,
          });
        }

        target = {
          workspaceId: path.workspaceId,
          gatewayId: path.gatewayId,
          userId: resolved.userId,
          upstreamUrl: resolveResponsesWebSocketUrl(
            path.provider,
            resolved.gatewayInfo?.customModelBaseUrl,
            openAIBaseUrl
          ),
          modelApiKey: resolved.modelApiKey,
          modelProvider: path.provider,
          modelOverride:
            path.provider === 'custom'
              ? resolved.gatewayInfo?.customModelName
              : undefined,
          customModelStrategy: resolved.gatewayInfo?.customModelStrategy,
          customModelInputPrice: resolved.gatewayInfo?.customModelInputPrice,
          customModelOutputPrice: resolved.gatewayInfo?.customModelOutputPrice,
        };

        try {
          upstream = await connectResponsesWebSocketUpstream(target);
        } catch (error) {
          throw Object.assign(new Error('Upstream WebSocket unavailable'), {
            statusCode: 502,
            cause: error,
          });
        }
      } else {
        let user: Awaited<ReturnType<typeof verifyUserApiKey>>;
        try {
          user = await verifyUserApiKey(requestApiKey);
        } catch (error) {
          throw Object.assign(new Error('Unauthorized'), {
            statusCode: 401,
            cause: error,
          });
        }

        const startedAt = Date.now();
        const candidates =
          await resolveAIRouterResponsesWebSocketCandidates(path);
        const handshakeAttempts: AIRouterAttemptSummary[] = [];

        for (const candidate of candidates) {
          try {
            const candidateTarget = buildAIRouterResponsesTarget({
              workspaceId: path.workspaceId,
              userId: user.id,
              candidate,
              openAIBaseUrl,
              routerId: path.routerId,
              handshakeAttempts,
            });
            const candidateUpstream =
              await connectResponsesWebSocketUpstream(candidateTarget);
            target = candidateTarget;
            upstream = candidateUpstream;
            break;
          } catch (error) {
            const statusCode =
              typeof (error as any)?.statusCode === 'number'
                ? (error as any).statusCode
                : undefined;
            const errorType = statusCode === undefined ? 'network' : undefined;
            const retryable = isAIRouterRetryableFailure({
              statusCode,
              errorType,
              retryableStatusCodes: candidate.node.retryableStatusCodes,
            });
            handshakeAttempts.push({
              gatewayId: candidate.node.gatewayId,
              statusCode,
              retryable,
              errorType,
              message: error instanceof Error ? error.message : String(error),
            });
            if (!retryable) break;
          }
        }

        if (!target || !upstream) {
          const error = Object.assign(
            new Error('No AI Router gateway accepted the WebSocket handshake'),
            { statusCode: 502 }
          );
          await createAIRouterResponsesWebSocketLog({
            workspaceId: path.workspaceId,
            routerId: path.routerId,
            handshakeAttempts,
            success: false,
            error,
            duration: Date.now() - startedAt,
          });
          throw error;
        }
      }

      if (socket.destroyed) {
        upstream.terminate();
        return;
      }

      const connectedUpstream = upstream;
      wss.handleUpgrade(request, socket, head, (downstream) => {
        wss.emit('connection', downstream, request);
        bridgeAIGatewayResponsesWebSocket({
          downstream,
          upstream: connectedUpstream,
          trackFinalization,
          ...target,
        });
      });
    } catch (error) {
      upstream?.terminate();
      logger.warn('[AI Gateway] Responses WebSocket upgrade failed', {
        error,
      });
      const statusCode =
        typeof (error as any)?.statusCode === 'number'
          ? (error as any).statusCode
          : 500;
      const statusText =
        statusCode === 401
          ? 'Unauthorized'
          : statusCode === 404
            ? 'Not Found'
            : statusCode === 502
              ? 'Bad Gateway'
              : 'Internal Server Error';
      socket.write(
        `HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`
      );
      socket.destroy();
    }
  });

  let closing: Promise<void> | undefined;
  return {
    close: () =>
      (closing ??= (async () => {
        for (const client of wss.clients) client.terminate();
        await new Promise<void>((resolve, reject) => {
          wss.close((error) => (error ? reject(error) : resolve()));
        });
        await Promise.all(pendingFinalizations);
      })()),
  };
}

export function initSocketio(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    transports: ['websocket'],
    serveClient: false,
    destroyUpgradeTimeout: 35_000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Setup Redis adapter if Redis URL is configured
  if (env.cache.redisUrl) {
    try {
      logger.info(
        '[WebSocket] Setting up Redis adapter with URL:',
        env.cache.redisUrl
      );

      const pubClient = new Redis(env.cache.redisUrl);
      const subClient = pubClient.duplicate();

      // Handle Redis connection events
      pubClient.on('error', (err: Error) => {
        logger.error('[WebSocket] Redis pub client error:', err);
      });

      subClient.on('error', (err: Error) => {
        logger.error('[WebSocket] Redis sub client error:', err);
      });

      pubClient.on('connect', () => {
        logger.info('[WebSocket] Redis pub client connected');
      });

      subClient.on('connect', () => {
        logger.info('[WebSocket] Redis sub client connected');
      });

      pubClient.on('close', () => {
        logger.warn('[WebSocket] Redis pub client disconnected');
      });

      subClient.on('close', () => {
        logger.warn('[WebSocket] Redis sub client disconnected');
      });

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('[WebSocket] Redis adapter configured successfully');
    } catch (error) {
      logger.error('[WebSocket] Failed to setup Redis adapter:', error);
      logger.warn('[WebSocket] Falling back to in-memory adapter');
    }
  } else {
    logger.info('[WebSocket] No Redis URL configured, using in-memory adapter');
  }

  io.of((name, auth, next) => {
    const workspaceId = name.replace(/^\//, '');

    next(null, isCuid(workspaceId)); // or false, when the creation is denied
  })
    .use(async (socket, next) => {
      // Auth
      try {
        const token = socket.handshake.auth['token'];
        let user: UserAuthPayload;

        if (token) {
          if (token.startsWith('sk_')) {
            // auth with api key
            const _user = await verifyUserApiKey(token);

            user = {
              id: _user.id,
              username: _user.username,
              role: _user.role,
            };
          } else {
            user = jwtVerify(token);
            logger.info(
              '[WebSocket] Authenticated via JWT:',
              user.id,
              user.username
            );
          }
        } else {
          const session = await getAuthSession(
            socket.request,
            socket.handshake.secure
          );
          if (!session) {
            throw new Error('Can not get user info.');
          }

          user = {
            id: session.user.id,
            username: session.user.name,
            role: session.user.role,
          };
          logger.info(
            '[WebSocket] Authenticated via Session:',
            user.id,
            user.username
          );
        }

        socket.data.user = user;
        socket.data.token = token;

        const workspaceId = socket.nsp.name.replace(/^\//, '');
        socket.data.workspaceId = workspaceId;

        next();
      } catch (err: any) {
        console.error('[Socket] Authenticated throw error:', err);
        next(err);
      }
    })
    .on('connection', (socket) => {
      if (!socket.data.user) {
        return;
      }

      socket.onAny((eventName, eventData, callback) => {
        // console.log('[Socket] receive:', { eventName, eventData });
        socketEventBus.emit(eventName, eventData, socket, callback);
      });

      socket.on('disconnect', () => {
        cleanupSocketSubscriptions(socket);
      });
    });
}
