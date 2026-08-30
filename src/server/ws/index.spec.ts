import { createServer, type Server } from 'http';
import { once } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as websocket from './index.js';

const aiGatewayMocks = vi.hoisted(() => ({
  resolveModelApiKey: vi.fn(),
  createPendingLog: vi.fn(),
  finishLog: vi.fn(),
  requestCounterInc: vi.fn(),
}));

const aiRouterMocks = vi.hoisted(() => ({
  resolveCandidates: vi.fn(),
  finishLog: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  verifyApiKey: vi.fn(),
}));

vi.mock('../model/aiGateway.js', () => ({
  openaiResponsesRequestSchema: {
    safeParse: (value: unknown) => {
      const event = value as Record<string, unknown>;
      return typeof event?.model === 'string' && 'input' in event
        ? { success: true, data: event }
        : { success: false };
    },
  },
  resolveAIGatewayModelApiKey: aiGatewayMocks.resolveModelApiKey,
  createAIGatewayPendingLog: aiGatewayMocks.createPendingLog,
  finishOpenAIResponsesGatewayLog: aiGatewayMocks.finishLog,
  getOpenAIResponsesStreamDelta: (event: any) =>
    event.type === 'response.output_text.delta' ? event.delta : '',
}));

vi.mock('../utils/prometheus/client.js', () => ({
  promAIGatewayRequestCounter: {
    inc: aiGatewayMocks.requestCounterInc,
  },
}));

vi.mock('../model/aiRouter.js', () => ({
  AI_ROUTER_PROTOCOLS: {
    OPENAI_RESPONSES: 'openai-responses',
  },
  isAIRouterRetryableFailure: ({
    statusCode,
    errorType,
    retryableStatusCodes,
  }: {
    statusCode?: number;
    errorType?: string;
    retryableStatusCodes?: number[];
  }) =>
    errorType === 'network' ||
    errorType === 'timeout' ||
    [429, 500, 502, 503, 504].includes(statusCode ?? 0) ||
    retryableStatusCodes?.includes(statusCode ?? 0) === true,
  resolveAIRouterResponsesWebSocketCandidates: aiRouterMocks.resolveCandidates,
  createAIRouterResponsesWebSocketLog: aiRouterMocks.finishLog,
}));

vi.mock('../model/user.js', () => ({
  verifyUserApiKey: userMocks.verifyApiKey,
}));

async function listen(server: Server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP server address');
  }

  return address.port;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('AI Gateway Responses WebSocket', () => {
  test('matches gateway and AI Router Responses WebSocket paths', () => {
    const parsePath = websocket.parseAIResponsesPath;

    expect(
      parsePath('/api/ai/workspace_1/gateway_1/openai/v1/responses?trace=1')
    ).toEqual({
      kind: 'gateway',
      workspaceId: 'workspace_1',
      gatewayId: 'gateway_1',
      provider: 'openai',
    });
    expect(
      parsePath('/api/ai/workspace_1/gateway_1/custom/v1/responses')
    ).toEqual({
      kind: 'gateway',
      workspaceId: 'workspace_1',
      gatewayId: 'gateway_1',
      provider: 'custom',
    });
    expect(
      parsePath('/api/ai-router/workspace_1/router_1/openai/v1/responses')
    ).toEqual({
      kind: 'router',
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      provider: 'openai',
    });
    expect(
      parsePath('/api/ai-router/workspace_1/router_1/custom/v1/responses')
    ).toEqual({
      kind: 'router',
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      provider: 'custom',
    });
    expect(parsePath('/socket.io/?EIO=4&transport=websocket')).toBeNull();
  });

  test('leaves delayed non-Socket.IO upgrades for other listeners', async () => {
    vi.useFakeTimers();
    const httpServer = createServer();
    const nativeWss = new WebSocketServer({ noServer: true });
    let markUpgradeReceived!: () => void;
    const upgradeReceived = new Promise<void>((resolve) => {
      markUpgradeReceived = resolve;
    });

    httpServer.on('upgrade', (request, socket, head) => {
      markUpgradeReceived();
      setTimeout(() => {
        if (!socket.writable) {
          return;
        }

        nativeWss.handleUpgrade(request, socket, head, (client) => {
          nativeWss.emit('connection', client, request);
        });
      }, 1_500);
    });
    websocket.initSocketio(httpServer);
    const port = await listen(httpServer);
    const client = new WebSocket(`ws://127.0.0.1:${port}/native`);
    const outcome = new Promise<'open' | 'error'>((resolve) => {
      client.once('open', () => resolve('open'));
      client.once('error', () => resolve('error'));
    });

    try {
      await upgradeReceived;
      await vi.advanceTimersByTimeAsync(1_500);

      expect(await outcome).toBe('open');
    } finally {
      client.terminate();
      for (const socket of nativeWss.clients) socket.terminate();
      httpServer.close();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  test('proxies official events with the resolved key and finishes the gateway log', async () => {
    const init = websocket.initAIGatewayResponsesWebSocket;

    aiGatewayMocks.resolveModelApiKey.mockResolvedValue({
      gatewayInfo: null,
      modelApiKey: 'upstream-key',
      userId: null,
    });
    aiGatewayMocks.createPendingLog.mockResolvedValue({ id: 'log_1' });
    aiGatewayMocks.finishLog.mockResolvedValue(undefined);

    const upstreamServer = createServer();
    const upstreamWss = new WebSocketServer({ server: upstreamServer });
    const upstreamPort = await listen(upstreamServer);
    let upstreamAuthorization: string | undefined;
    let upstreamPath: string | undefined;
    let upstreamPayload: unknown;

    upstreamWss.on('connection', (socket, request) => {
      upstreamAuthorization = request.headers.authorization;
      upstreamPath = request.url;
      socket.on('message', (data) => {
        upstreamPayload = JSON.parse(data.toString());
        socket.send(
          JSON.stringify({
            type: 'response.created',
            response: { id: 'resp_1', model: 'gpt-5-mini' },
          })
        );
        socket.send(
          JSON.stringify({
            type: 'response.output_text.delta',
            response_id: 'resp_1',
            delta: 'pong',
          })
        );
        socket.send(
          JSON.stringify({
            type: 'response.done',
            response: {
              id: 'resp_1',
              status: 'completed',
              model: 'gpt-5-mini',
              usage: { input_tokens: 1, output_tokens: 1 },
              output: [],
            },
          })
        );
      });
    });

    const gatewayServer = createServer();
    const proxyWss = init(gatewayServer, `ws://127.0.0.1:${upstreamPort}/v1`);
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai/workspace_1/gateway_1/openai/v1/responses`,
      { headers: { Authorization: 'Bearer gateway-key' } }
    );

    try {
      await once(client, 'open');
      const received: unknown[] = [];
      const completed = new Promise<void>((resolve, reject) => {
        client.on('message', (data) => {
          const event = JSON.parse(data.toString());
          received.push(event);
          if (event.type === 'response.done') {
            resolve();
          }
        });
        client.once('error', reject);
      });

      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'gpt-5-mini',
          input: 'ping',
        })
      );
      await completed;

      await vi.waitFor(() => {
        expect(aiGatewayMocks.finishLog).toHaveBeenCalledWith(
          expect.objectContaining({
            logId: 'log_1',
            outputContent: 'pong',
            response: expect.objectContaining({ id: 'resp_1' }),
          })
        );
      });

      expect(upstreamAuthorization).toBe('Bearer upstream-key');
      expect(upstreamPath).toBe('/v1/responses');
      expect(upstreamPayload).toEqual({
        type: 'response.create',
        model: 'gpt-5-mini',
        input: 'ping',
      });
      expect(received.map((event: any) => event.type)).toEqual([
        'response.created',
        'response.output_text.delta',
        'response.done',
      ]);
    } finally {
      client.terminate();
      for (const socket of upstreamWss.clients) socket.terminate();
      proxyWss.close();
      upstreamWss.close();
      gatewayServer.close();
      upstreamServer.close();
    }
  });

  test('rejects an overlapping response.create without forwarding it upstream', async () => {
    aiGatewayMocks.resolveModelApiKey.mockResolvedValue({
      gatewayInfo: null,
      modelApiKey: 'upstream-key',
      userId: null,
    });
    aiGatewayMocks.createPendingLog.mockResolvedValue({ id: 'log_overlap' });
    aiGatewayMocks.finishLog.mockResolvedValue(undefined);

    const upstreamServer = createServer();
    const upstreamWss = new WebSocketServer({ server: upstreamServer });
    const upstreamPort = await listen(upstreamServer);
    const upstreamMessages: unknown[] = [];
    let upstreamSocket: WebSocket | undefined;
    upstreamWss.on('connection', (socket) => {
      upstreamSocket = socket;
      socket.on('message', (data) => {
        upstreamMessages.push(JSON.parse(data.toString()));
      });
    });

    const gatewayServer = createServer();
    const proxyWss = websocket.initAIGatewayResponsesWebSocket(
      gatewayServer,
      `ws://127.0.0.1:${upstreamPort}/v1`
    );
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai/workspace_1/gateway_1/openai/v1/responses`,
      { headers: { Authorization: 'Bearer gateway-key' } }
    );

    try {
      await once(client, 'open');
      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'gpt-5-mini',
          input: 'first',
        })
      );
      await vi.waitFor(() => expect(upstreamMessages).toHaveLength(1));

      const errorEvent = once(client, 'message');
      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'gpt-5-mini',
          input: 'second',
        })
      );

      expect(JSON.parse((await errorEvent)[0].toString())).toEqual(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            message: expect.stringContaining('already in progress'),
          }),
        })
      );
      expect(upstreamMessages).toHaveLength(1);
      expect(aiGatewayMocks.createPendingLog).toHaveBeenCalledTimes(1);

      upstreamSocket?.send(
        JSON.stringify({
          type: 'response.done',
          response: { id: 'resp_overlap', status: 'completed' },
        })
      );
    } finally {
      client.terminate();
      upstreamSocket?.terminate();
      proxyWss.close();
      upstreamWss.close();
      gatewayServer.close();
      upstreamServer.close();
    }
  });

  test('waits for active response logs while closing', async () => {
    aiGatewayMocks.resolveModelApiKey.mockResolvedValue({
      gatewayInfo: null,
      modelApiKey: 'upstream-key',
      userId: null,
    });
    aiGatewayMocks.createPendingLog.mockResolvedValue({ id: 'log_shutdown' });
    let finishLog: (() => void) | undefined;
    aiGatewayMocks.finishLog.mockReturnValue(
      new Promise<void>((resolve) => {
        finishLog = resolve;
      })
    );

    const upstreamServer = createServer();
    const upstreamWss = new WebSocketServer({ server: upstreamServer });
    const upstreamPort = await listen(upstreamServer);
    const upstreamReceived = new Promise<void>((resolve) => {
      upstreamWss.on('connection', (socket) => {
        socket.once('message', () => resolve());
      });
    });

    const gatewayServer = createServer();
    const proxyWss = websocket.initAIGatewayResponsesWebSocket(
      gatewayServer,
      `ws://127.0.0.1:${upstreamPort}/v1`
    );
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai/workspace_1/gateway_1/openai/v1/responses`,
      { headers: { Authorization: 'Bearer gateway-key' } }
    );

    try {
      await once(client, 'open');
      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'gpt-5-mini',
          input: 'ping',
        })
      );
      await upstreamReceived;

      let closed = false;
      const closing = proxyWss.close().then(() => {
        closed = true;
      });
      await vi.waitFor(() => {
        expect(aiGatewayMocks.finishLog).toHaveBeenCalledWith(
          expect.objectContaining({
            logId: 'log_shutdown',
            error: expect.any(Error),
          })
        );
      });
      expect(closed).toBe(false);

      finishLog?.();
      await closing;
      expect(closed).toBe(true);
    } finally {
      client.terminate();
      for (const socket of upstreamWss.clients) socket.terminate();
      proxyWss.close();
      upstreamWss.close();
      gatewayServer.close();
      upstreamServer.close();
    }
  });

  test('uses a custom base URL and configured model for custom gateways', async () => {
    const init = websocket.initAIGatewayResponsesWebSocket;
    const upstreamServer = createServer();
    const upstreamWss = new WebSocketServer({ server: upstreamServer });
    const upstreamPort = await listen(upstreamServer);
    let upstreamPath: string | undefined;
    let upstreamPayload: any;

    upstreamWss.on('connection', (socket, request) => {
      upstreamPath = request.url;
      socket.on('message', (data) => {
        upstreamPayload = JSON.parse(data.toString());
        socket.send(
          JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_custom',
              model: 'configured-model',
              usage: { input_tokens: 2, output_tokens: 3 },
              output: [],
            },
          })
        );
      });
    });

    aiGatewayMocks.resolveModelApiKey.mockResolvedValue({
      gatewayInfo: {
        customModelBaseUrl: `http://127.0.0.1:${upstreamPort}/v1`,
        customModelName: 'configured-model',
        customModelInputPrice: 1,
        customModelOutputPrice: 2,
      },
      modelApiKey: 'custom-upstream-key',
      userId: 'user_1',
    });
    aiGatewayMocks.createPendingLog.mockResolvedValue({ id: 'log_custom' });
    aiGatewayMocks.finishLog.mockResolvedValue(undefined);

    const gatewayServer = createServer();
    const proxyWss = init(gatewayServer);
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai/workspace_1/gateway_1/custom/v1/responses`,
      { headers: { Authorization: 'Bearer gateway-key' } }
    );

    try {
      await once(client, 'open');
      const completed = once(client, 'message');
      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'request-model',
          input: 'ping',
        })
      );
      await completed;

      await vi.waitFor(() => {
        expect(aiGatewayMocks.finishLog).toHaveBeenCalledWith(
          expect.objectContaining({
            logId: 'log_custom',
            modelName: 'configured-model',
            modelProvider: 'custom',
            customModelInputPrice: 1,
            customModelOutputPrice: 2,
          })
        );
      });

      expect(upstreamPath).toBe('/v1/responses');
      expect(upstreamPayload).toEqual({
        type: 'response.create',
        model: 'configured-model',
        input: 'ping',
      });
      expect(aiGatewayMocks.createPendingLog).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: 'configured-model',
          modelProvider: 'custom',
        })
      );
    } finally {
      client.terminate();
      for (const socket of upstreamWss.clients) socket.terminate();
      proxyWss.close();
      upstreamWss.close();
      gatewayServer.close();
      upstreamServer.close();
    }
  });

  test('falls back during AI Router handshake and pins the successful node', async () => {
    const rejectedServer = createServer();
    rejectedServer.on('upgrade', (_request, socket) => {
      socket.write(
        'HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n'
      );
      socket.destroy();
    });
    const rejectedPort = await listen(rejectedServer);

    const selectedServer = createServer();
    const selectedWss = new WebSocketServer({ server: selectedServer });
    const selectedPort = await listen(selectedServer);
    let selectedSocket: WebSocket | undefined;
    let selectedPayload: any;
    selectedWss.on('connection', (socket) => {
      selectedSocket = socket;
      socket.on('message', (data) => {
        selectedPayload = JSON.parse(data.toString());
        socket.send(
          JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_router',
              model: 'node-model',
              usage: { input_tokens: 1, output_tokens: 1 },
              output: [],
            },
          })
        );
      });
    });

    const unusedServer = createServer();
    const unusedWss = new WebSocketServer({ server: unusedServer });
    const unusedPort = await listen(unusedServer);
    let unusedConnections = 0;
    unusedWss.on('connection', () => {
      unusedConnections += 1;
    });

    userMocks.verifyApiKey.mockResolvedValue({ id: 'user_router' });
    aiRouterMocks.resolveCandidates.mockResolvedValue([
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_rejected',
          modelOverride: 'rejected-model',
          timeoutMs: 1_000,
          gateway: {
            id: 'gateway_rejected',
            modelApiKey: 'rejected-key',
            customModelBaseUrl: `http://127.0.0.1:${rejectedPort}/v1`,
          },
        },
      },
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_selected',
          modelOverride: 'node-model',
          timeoutMs: 1_000,
          gateway: {
            id: 'gateway_selected',
            modelApiKey: 'selected-key',
            customModelBaseUrl: `http://127.0.0.1:${selectedPort}/v1`,
          },
        },
      },
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_unused',
          timeoutMs: 1_000,
          gateway: {
            id: 'gateway_unused',
            modelApiKey: 'unused-key',
            customModelBaseUrl: `http://127.0.0.1:${unusedPort}/v1`,
          },
        },
      },
    ]);
    aiGatewayMocks.createPendingLog.mockResolvedValue({ id: 'log_router' });
    aiGatewayMocks.finishLog.mockResolvedValue(undefined);
    aiRouterMocks.finishLog.mockResolvedValue(undefined);

    const gatewayServer = createServer();
    const proxyWss = websocket.initAIGatewayResponsesWebSocket(gatewayServer);
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai-router/workspace_1/router_1/custom/v1/responses`,
      { headers: { Authorization: 'Bearer router-key' } }
    );

    try {
      await once(client, 'open');
      const completed = once(client, 'message');
      client.send(
        JSON.stringify({
          type: 'response.create',
          model: 'request-model',
          input: 'ping',
        })
      );
      await completed;

      await vi.waitFor(() => {
        expect(aiRouterMocks.finishLog).toHaveBeenCalledWith(
          expect.objectContaining({
            gatewayId: 'gateway_selected',
            gatewayLogId: 'log_router',
            success: true,
            handshakeAttempts: [
              expect.objectContaining({ gatewayId: 'gateway_rejected' }),
            ],
          })
        );
      });

      expect(userMocks.verifyApiKey).toHaveBeenCalledWith('router-key');
      expect(selectedPayload).toEqual({
        type: 'response.create',
        model: 'node-model',
        input: 'ping',
      });

      const clientClosed = once(client, 'close');
      selectedSocket?.close();
      await clientClosed;
      expect(unusedConnections).toBe(0);
    } finally {
      client.terminate();
      selectedSocket?.terminate();
      for (const socket of unusedWss.clients) socket.terminate();
      proxyWss.close();
      selectedWss.close();
      unusedWss.close();
      rejectedServer.close();
      selectedServer.close();
      unusedServer.close();
      gatewayServer.close();
    }
  });

  test('stops AI Router fallback after a non-retryable handshake rejection', async () => {
    const rejectedServer = createServer();
    rejectedServer.on('upgrade', (_request, socket) => {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
    });
    const rejectedPort = await listen(rejectedServer);

    const fallbackServer = createServer();
    const fallbackWss = new WebSocketServer({ server: fallbackServer });
    const fallbackPort = await listen(fallbackServer);
    let fallbackConnections = 0;
    fallbackWss.on('connection', () => {
      fallbackConnections += 1;
    });

    userMocks.verifyApiKey.mockResolvedValue({ id: 'user_router' });
    aiRouterMocks.resolveCandidates.mockResolvedValue([
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_rejected',
          timeoutMs: 1_000,
          retryableStatusCodes: [418],
          gateway: {
            id: 'gateway_rejected',
            modelApiKey: 'rejected-key',
            customModelBaseUrl: `http://127.0.0.1:${rejectedPort}/v1`,
          },
        },
      },
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_fallback',
          timeoutMs: 1_000,
          gateway: {
            id: 'gateway_fallback',
            modelApiKey: 'fallback-key',
            customModelBaseUrl: `http://127.0.0.1:${fallbackPort}/v1`,
          },
        },
      },
    ]);
    aiRouterMocks.finishLog.mockResolvedValue(undefined);

    const gatewayServer = createServer();
    const proxyWss = websocket.initAIGatewayResponsesWebSocket(gatewayServer);
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai-router/workspace_1/router_1/custom/v1/responses`,
      { headers: { Authorization: 'Bearer router-key' } }
    );

    try {
      const outcome = await new Promise<'open' | 'error'>((resolve) => {
        client.once('open', () => resolve('open'));
        client.once('error', () => resolve('error'));
      });

      expect(outcome).toBe('error');
      expect(fallbackConnections).toBe(0);
      expect(aiRouterMocks.finishLog).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace_1',
          routerId: 'router_1',
          success: false,
          handshakeAttempts: [
            expect.objectContaining({
              gatewayId: 'gateway_rejected',
              statusCode: 401,
              retryable: false,
            }),
          ],
        })
      );
    } finally {
      client.terminate();
      for (const socket of fallbackWss.clients) socket.terminate();
      proxyWss.close();
      fallbackWss.close();
      rejectedServer.close();
      fallbackServer.close();
      gatewayServer.close();
    }
  });

  test('logs failed AI Router handshakes after exhausting retryable candidates', async () => {
    const customRetryServer = createServer();
    customRetryServer.on('upgrade', (_request, socket) => {
      socket.write("HTTP/1.1 418 I'm a Teapot\r\nConnection: close\r\n\r\n");
      socket.destroy();
    });
    const customRetryPort = await listen(customRetryServer);

    const unavailableServer = createServer();
    unavailableServer.on('upgrade', (_request, socket) => {
      socket.write(
        'HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n'
      );
      socket.destroy();
    });
    const unavailablePort = await listen(unavailableServer);

    userMocks.verifyApiKey.mockResolvedValue({ id: 'user_router' });
    aiRouterMocks.resolveCandidates.mockResolvedValue([
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_custom_retry',
          timeoutMs: 1_000,
          retryableStatusCodes: [418],
          gateway: {
            id: 'gateway_custom_retry',
            modelApiKey: 'custom-retry-key',
            customModelBaseUrl: `http://127.0.0.1:${customRetryPort}/v1`,
          },
        },
      },
      {
        modelProvider: 'custom',
        node: {
          gatewayId: 'gateway_unavailable',
          timeoutMs: 1_000,
          gateway: {
            id: 'gateway_unavailable',
            modelApiKey: 'unavailable-key',
            customModelBaseUrl: `http://127.0.0.1:${unavailablePort}/v1`,
          },
        },
      },
    ]);
    aiRouterMocks.finishLog.mockResolvedValue(undefined);

    const gatewayServer = createServer();
    const proxyWss = websocket.initAIGatewayResponsesWebSocket(gatewayServer);
    const gatewayPort = await listen(gatewayServer);
    const client = new WebSocket(
      `ws://127.0.0.1:${gatewayPort}/api/ai-router/workspace_1/router_1/custom/v1/responses`,
      { headers: { Authorization: 'Bearer router-key' } }
    );

    try {
      await once(client, 'error');
      expect(aiRouterMocks.finishLog).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace_1',
          routerId: 'router_1',
          success: false,
          handshakeAttempts: [
            expect.objectContaining({
              gatewayId: 'gateway_custom_retry',
              statusCode: 418,
              retryable: true,
            }),
            expect.objectContaining({
              gatewayId: 'gateway_unavailable',
              statusCode: 503,
              retryable: true,
            }),
          ],
        })
      );
    } finally {
      client.terminate();
      proxyWss.close();
      customRetryServer.close();
      unavailableServer.close();
      gatewayServer.close();
    }
  });
});
