import {
  GoogleGenAI,
  type Content,
  type GenerateContentResponse,
} from '@google/genai';
import { Prisma, type AIGateway } from '@prisma/client';
import type { RequestHandler } from 'express';
import { once } from 'node:events';
import { z } from 'zod';
import {
  buildAIGatewayForwardHeaders,
  calcAIGatewayCustomModelPrice,
  calcAIGatewayTpot,
  createAIGatewayPendingLog,
  resolveAIGatewayModelApiKey,
  setAIGatewayStreamHeaders,
  startAIGatewayStreamKeepAlive,
  trackAIGatewayPendingLog,
} from '../aiGateway.js';
import { prisma } from '../_client.js';
import { checkQuotaAlert } from './quotaAlert.js';
import { redactSecret } from './redactSecret.js';
import { logger } from '../../utils/logger.js';
import { promAIGatewayRequestCounter } from '../../utils/prometheus/client.js';

const contentsSchema = z
  .array(
    z.looseObject({
      role: z.string().optional(),
      parts: z.array(z.record(z.string(), z.unknown())).nonempty(),
    })
  )
  .nonempty();
const generationSchema = z.strictObject({
  contents: contentsSchema,
  model: z.string().optional(),
  systemInstruction: z.record(z.string(), z.unknown()).optional(),
  tools: z.array(z.record(z.string(), z.unknown())).optional(),
  toolConfig: z.record(z.string(), z.unknown()).optional(),
  safetySettings: z.array(z.record(z.string(), z.unknown())).optional(),
  generationConfig: z
    .record(z.string(), z.unknown())
    .refine(
      (config) =>
        ![
          'httpOptions',
          'abortSignal',
          'automaticFunctionCalling',
          'config',
          'apiKey',
          'baseUrl',
        ].some((key) => key in config)
    )
    .optional(),
  cachedContent: z.string().optional(),
});
const countSchema = z.union([
  z.strictObject({ contents: contentsSchema }),
  z.strictObject({ generateContentRequest: generationSchema }),
]);

function failure(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function validateModel(model: string) {
  if (
    !/^[\w.-]+(?:\/[\w.-]+)*$/.test(model) ||
    model.includes('..') ||
    model.split('/').includes('.')
  ) {
    throw failure(400, 'Invalid Gemini model path.');
  }
  return model;
}

function resolveBaseUrl(value: string | null, requestVersion: string) {
  let url: URL;
  let pathname: string;
  let apiVersion = requestVersion;
  try {
    url = new URL(value || '');
    const version = url.pathname.match(/\/(v1|v1beta)\/?$/);
    if (version) {
      apiVersion = version[1];
      url.pathname = url.pathname.slice(0, -version[0].length);
    }
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw failure(
      400,
      'Configure a Gemini upstream base URL before using this endpoint.'
    );
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /\/(?:v1|v1beta)(?:\/|$)|:/.test(pathname)
  ) {
    throw failure(
      400,
      'Gemini upstream base URL must use HTTP(S), optionally end in /v1 or /v1beta, and contain no credentials, query, fragment, or API action path.'
    );
  }
  return { baseUrl: url.toString().replace(/\/$/, ''), apiVersion };
}

export function geminiError(code: number, message: string) {
  const statuses: Record<number, string> = {
    400: 'INVALID_ARGUMENT',
    401: 'UNAUTHENTICATED',
    403: 'PERMISSION_DENIED',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    413: 'RESOURCE_EXHAUSTED',
    429: 'RESOURCE_EXHAUSTED',
    499: 'CANCELLED',
    500: 'INTERNAL',
    502: 'UNAVAILABLE',
    503: 'UNAVAILABLE',
    504: 'DEADLINE_EXCEEDED',
  };
  return { error: { code, status: statuses[code] ?? 'UNKNOWN', message } };
}

export const geminiHandler: RequestHandler = async (req, res) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let totalTimer: ReturnType<typeof setTimeout> | undefined;
  let stopKeepAlive: (() => void) | undefined;
  let logId: string | undefined;
  let gateway: AIGateway | undefined;
  let requestKey = '';
  let upstreamKey = '';
  let requestedModel = '';
  let action = '';
  let modelName = '';
  let ttft = -1;
  let errorPayload: ReturnType<typeof geminiError> | undefined;
  const responses: object[] = [];
  let usage: NonNullable<GenerateContentResponse['usageMetadata']> = {};
  const candidates = new Map<number, boolean>();
  let blocked = false;
  let stream = false;
  const disconnect = () => {
    if (!res.writableEnded)
      controller.abort(failure(499, 'Client disconnected.'));
  };
  res.on('close', disconnect);
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => controller.abort(failure(504, 'Gemini upstream timed out.')),
      120_000
    );
    idleTimer.unref();
  };

  try {
    const version = req.params.version;
    const path = req.params[0]; // Express decodes the entire slash-containing model once.
    const separator = path.lastIndexOf(':');
    action = path.slice(separator + 1);
    if (
      !['v1', 'v1beta'].includes(version) ||
      separator < 0 ||
      !['generateContent', 'streamGenerateContent', 'countTokens'].includes(
        action
      )
    ) {
      throw failure(404, 'Gemini endpoint not found.');
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw failure(405, 'Use POST for this Gemini endpoint.');
    }
    requestedModel = validateModel(path.slice(0, separator));
    stream = action === 'streamGenerateContent';
    if (
      Object.keys(req.query).some((key) => key !== 'alt') ||
      (req.query.alt !== undefined && (!stream || req.query.alt !== 'sse'))
    ) {
      throw failure(
        400,
        'Only alt=sse is supported for Gemini streaming requests.'
      );
    }
    const bearer = req.get('authorization');
    if (bearer && !/^Bearer\s+\S+$/i.test(bearer))
      throw failure(401, 'Invalid authorization header.');
    requestKey =
      req.get('x-goog-api-key')?.trim() ||
      bearer?.replace(/^Bearer\s+/i, '') ||
      '';
    if (bearer && bearer.replace(/^Bearer\s+/i, '') !== requestKey) {
      throw failure(400, 'Conflicting API keys.');
    }
    const parsed = (
      action === 'countTokens' ? countSchema : generationSchema
    ).safeParse(req.body);
    if (!parsed.success)
      throw failure(400, 'Invalid or unsupported Gemini request fields.');
    const resolved = await resolveAIGatewayModelApiKey({
      workspaceId: req.params.workspaceId,
      gatewayId: req.params.gatewayId,
      requestApiKey: requestKey,
    });
    gateway = resolved.gatewayInfo;
    upstreamKey = resolved.modelApiKey;
    const { baseUrl, apiVersion } = resolveBaseUrl(
      gateway.customModelBaseUrl,
      version
    );
    modelName = validateModel(gateway.customModelName || requestedModel);
    const model = `models/${modelName}`;
    const body = parsed.data;
    if ('generateContentRequest' in body)
      body.generateContentRequest.model = model;
    if ('model' in body) body.model = model;
    const pending = trackAIGatewayPendingLog(
      req,
      createAIGatewayPendingLog({
        workspaceId: req.params.workspaceId,
        gatewayId: req.params.gatewayId,
        modelName,
        modelProvider: 'custom',
        stream,
        userId: resolved.userId,
        requestPayload: {
          ...body,
          gateway: { protocol: 'gemini', action, requestedModel },
        },
      })
    );
    logId = (await pending).id;
    controller.signal.throwIfAborted();
    promAIGatewayRequestCounter.inc({ modelProvider: 'custom' });
    totalTimer = setTimeout(
      () => controller.abort(failure(504, 'Gemini upstream timed out.')),
      600_000
    );
    totalTimer.unref();
    const ai = new GoogleGenAI({
      apiKey: upstreamKey,
      vertexai: false,
      httpOptions: {
        baseUrl,
        apiVersion,
        timeout: 600_000,
        retryOptions: { attempts: 1 },
        headers: buildAIGatewayForwardHeaders(req),
      },
    });
    // REST schemas/signatures must not be rewritten by SDK's content/config converters.
    // extraBody is restricted to the validated REST envelope, never caller SDK options.
    const config = {
      abortSignal: controller.signal,
      automaticFunctionCalling: { disable: true },
      httpOptions: { extraBody: body },
    };
    resetIdle();
    if (action === 'countTokens') {
      const result = await ai.models.countTokens({
        model,
        // The SDK supports omitted contents at runtime for native generateContentRequest.
        contents: ('contents' in body ? body.contents : undefined) as Content[],
        config,
      });
      const { sdkHttpResponse: _headers, ...data } = result;
      if (!Number.isSafeInteger(data.totalTokens) || data.totalTokens! < 0)
        throw failure(502, 'Invalid Gemini token count.');
      responses.push(data);
      res.json(data);
    } else {
      const params = {
        model,
        contents: ('contents' in body ? body.contents : []) as Content[],
        config,
      };
      const record = (result: GenerateContentResponse) => {
        const {
          sdkHttpResponse: _headers,
          candidates: sdkCandidates,
          ...rest
        } = result;
        const data = {
          ...rest,
          ...(sdkCandidates && {
            candidates: sdkCandidates.map(
              ({ citationMetadata, ...candidate }) => ({
                ...candidate,
                // The SDK renames this native field; restore it for downstream SDKs.
                ...(citationMetadata && {
                  citationMetadata: {
                    citationSources: citationMetadata.citations,
                  },
                }),
              })
            ),
          }),
        };
        if (
          !data.candidates?.length &&
          !data.usageMetadata &&
          !data.promptFeedback
        ) {
          throw failure(502, 'Invalid Gemini upstream response.');
        }
        resetIdle();
        if (
          data.candidates?.some(
            (candidate) => candidate.content?.parts?.length
          ) &&
          ttft < 0
        )
          ttft = Date.now() - startedAt;
        for (const candidate of data.candidates ?? []) {
          const index = candidate.index ?? 0;
          candidates.set(
            index,
            candidates.get(index) === true || Boolean(candidate.finishReason)
          );
        }
        blocked ||= Boolean(data.promptFeedback?.blockReason);
        if (data.usageMetadata) {
          const nextUsage = { ...usage, ...data.usageMetadata };
          // Prisma token columns are Int32; reject bad usage before replacing a valid tail.
          if (
            [
              nextUsage.promptTokenCount,
              nextUsage.candidatesTokenCount,
              nextUsage.thoughtsTokenCount,
              nextUsage.cachedContentTokenCount,
            ].some(
              (value) =>
                value !== undefined &&
                (!Number.isInteger(value) || value < 0 || value > 2147483647)
            ) ||
            (nextUsage.candidatesTokenCount ?? 0) +
              (nextUsage.thoughtsTokenCount ?? 0) >
              2147483647
          ) {
            throw failure(502, 'Invalid Gemini usage metadata.');
          }
          usage = nextUsage;
        }
        responses.push(data);
        return data;
      };
      if (stream) {
        const chunks = await ai.models.generateContentStream(params);
        for await (const chunk of chunks) {
          const data = record(chunk);
          if (!res.headersSent) {
            setAIGatewayStreamHeaders(res);
            stopKeepAlive = startAIGatewayStreamKeepAlive(res);
          }
          const writable = res.write(`data: ${JSON.stringify(data)}\n\n`);
          res.flush?.();
          if (!writable) {
            await once(res, 'drain', { signal: controller.signal });
          }
        }
        if (
          !blocked &&
          (!candidates.size ||
            [...candidates.values()].some((finished) => !finished))
        ) {
          throw failure(502, 'Gemini upstream stream ended before completion.');
        }
        res.end();
      } else {
        res.json(record(await ai.models.generateContent(params)));
      }
    }
  } catch (caught) {
    const error = controller.signal.aborted ? controller.signal.reason : caught;
    const rawStatus = (error as { status?: number })?.status;
    const status =
      Number.isInteger(rawStatus) && rawStatus! >= 400 && rawStatus! <= 599
        ? rawStatus!
        : 502;
    // SDK exceptions may contain the whole upstream payload. Never expose it or credentials.
    let message = rawStatus
      ? (error as Error).message
      : 'Gemini upstream request failed.';
    try {
      message =
        JSON.parse(message).error?.message || 'Gemini upstream request failed.';
    } catch {
      /* Plain local error. */
    }
    errorPayload = geminiError(
      status,
      redactSecret(redactSecret(String(message), requestKey), upstreamKey)
    );
    if (!res.destroyed && !res.writableEnded) {
      if (res.headersSent) {
        // Google GenAI recognizes raw error JSON in a stream. An SSE data:error event
        // is silently converted to an empty candidate by SDK 2.22.0.
        res.end(JSON.stringify(errorPayload));
      } else res.status(status).json(errorPayload);
    }
  } finally {
    clearTimeout(idleTimer);
    clearTimeout(totalTimer);
    stopKeepAlive?.();
    res.off('close', disconnect);
    controller.abort();
    if (logId && gateway) {
      const inputToken = usage.promptTokenCount ?? 0;
      const outputToken =
        (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
      const cacheReadInputToken = Math.min(
        inputToken,
        usage.cachedContentTokenCount ?? 0
      );
      const price =
        action === 'countTokens'
          ? new Prisma.Decimal(0)
          : calcAIGatewayCustomModelPrice({
              inputToken,
              outputToken,
              cacheReadInputToken,
              inputTokenIncludesCache: true,
              customModelStrategy: gateway.customModelStrategy,
              customModelInputPrice: gateway.customModelInputPrice,
              customModelOutputPrice: gateway.customModelOutputPrice,
            });
      const status = errorPayload ? 'Failed' : 'Success';
      const duration = Date.now() - startedAt;
      try {
        await prisma.aIGatewayLogs.update({
          where: { id: logId },
          data: {
            status,
            duration,
            ttft,
            inputToken,
            outputToken,
            cacheReadInputToken,
            tpot: calcAIGatewayTpot({
              status,
              duration,
              ttft,
              outputToken,
              stream,
            }),
            price: price ?? 0,
            responsePayload: JSON.parse(
              JSON.stringify({
                response: stream ? responses : responses[0],
                usage,
                ...errorPayload,
                gateway: {
                  protocol: 'gemini',
                  action,
                  requestedModel,
                  usageSource:
                    action === 'countTokens'
                      ? 'countTokens'
                      : Object.keys(usage).length
                        ? 'upstream'
                        : 'unknown',
                  priceKnown:
                    action === 'countTokens' ||
                    (price !== null &&
                      usage.promptTokenCount !== undefined &&
                      usage.candidatesTokenCount !== undefined),
                },
              })
            ),
          },
        });
        if (price?.greaterThan(0))
          await checkQuotaAlert(
            req.params.workspaceId,
            req.params.gatewayId,
            Number(price)
          );
      } catch {
        logger.error('[Gemini Gateway] Failed to finalize request log', {
          logId,
        });
      }
    }
  }
};
