import {
  fetchAIGatewayUrl,
  parseAIGatewayUrl,
} from '../../utils/aiGatewayUrl.js';
import {
  GoogleGenAI,
  type Content,
  type GenerateContentResponse,
} from '@google/genai/node';
import { Prisma, type AIGateway } from '@prisma/client';
import type { Request, RequestHandler, Response } from 'express';
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

type GeminiVersion = 'v1' | 'v1beta';
type GeminiAction =
  | 'generateContent'
  | 'streamGenerateContent'
  | 'countTokens';
type GeminiUpstreamFormat = 'gemini' | 'cloudflare-ai-run';
type GenerationBody = z.infer<typeof generationSchema>;
type CountBody = z.infer<typeof countSchema>;
type GeminiRequestBody = GenerationBody | CountBody;
type GeminiUsageMetadata = NonNullable<
  GenerateContentResponse['usageMetadata']
>;

const GEMINI_IDLE_TIMEOUT_MS = 120_000;
const GEMINI_TOTAL_TIMEOUT_MS = 600_000;
const MAX_PRISMA_INT32 = 2147483647;

class GeminiGatewayError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GeminiGatewayError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failure(status: number, message: string) {
  return new GeminiGatewayError(status, message);
}

function assertValidModelPath(
  model: string,
  options: { allowLeadingAt?: boolean } = {}
) {
  const pattern = options.allowLeadingAt
    ? /^@?[\w.-]+(?:\/[\w.-]+)*$/
    : /^[\w.-]+(?:\/[\w.-]+)*$/;
  if (
    !pattern.test(model) ||
    model.includes('..') ||
    model.split('/').includes('.')
  ) {
    throw failure(400, 'Invalid Gemini model path.');
  }
  return model;
}

function validateModel(model: string) {
  return assertValidModelPath(model);
}

function resolveCloudflareModel(model: string) {
  assertValidModelPath(model, { allowLeadingAt: true });
  const normalized = model.replace(/^models\//, '');
  return normalized.includes('/') ? normalized : `google/${normalized}`;
}

function resolveCloudflareGatewayId(strategy: unknown): string | undefined {
  if (!isRecord(strategy)) return undefined;
  const value = strategy.cloudflareGatewayId;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && /^[\x21-\x7E]+$/.test(trimmed) ? trimmed : undefined;
}

function extractCloudflareError(payload: unknown): {
  status?: number;
  message?: string;
} {
  if (!isRecord(payload)) return {};
  if (Array.isArray(payload.errors)) {
    for (const entry of payload.errors) {
      if (typeof entry === 'string' && entry.trim()) {
        return { message: entry.trim() };
      }
      if (isRecord(entry)) {
        const message =
          typeof entry.message === 'string' && entry.message.trim()
            ? entry.message.trim()
            : entry.code !== undefined
              ? `Cloudflare error ${entry.code}`
              : undefined;
        if (message) return { message };
      }
    }
  }
  if (isRecord(payload.error)) {
    const status =
      typeof payload.error.code === 'number' &&
      Number.isInteger(payload.error.code) &&
      payload.error.code >= 400 &&
      payload.error.code <= 599
        ? payload.error.code
        : undefined;
    const message =
      typeof payload.error.message === 'string' && payload.error.message.trim()
        ? payload.error.message.trim()
        : undefined;
    if (message || status) return { status, message };
  }
  if (typeof payload.error === 'string' && payload.error.trim()) {
    return { message: payload.error.trim() };
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return { message: payload.message.trim() };
  }
  return {};
}

function unwrapCloudflarePayload(payload: unknown): {
  data?: GenerateContentResponse;
  error?: { status?: number; message: string };
} {
  if (!isRecord(payload)) return {};
  const hasErrors =
    Array.isArray(payload.errors) && payload.errors.length > 0;
  if (
    payload.success === false ||
    (payload.error !== undefined && payload.error !== null) ||
    hasErrors
  ) {
    const extracted = extractCloudflareError(payload);
    return {
      error: {
        status: extracted.status,
        message: extracted.message || 'Gemini upstream request failed.',
      },
    };
  }
  if ('result' in payload) {
    return isRecord(payload.result)
      ? { data: payload.result as unknown as GenerateContentResponse }
      : {};
  }
  return { data: payload as unknown as GenerateContentResponse };
}

function parseCloudflareResponse(raw: string): GenerateContentResponse {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw failure(502, 'Invalid Gemini upstream response.');
  }
  const unwrapped = unwrapCloudflarePayload(payload);
  if (unwrapped.error) {
    throw failure(unwrapped.error.status ?? 502, unwrapped.error.message);
  }
  if (!unwrapped.data) {
    throw failure(502, 'Invalid Gemini upstream response.');
  }
  return unwrapped.data;
}

async function* iterateSseData(
  body: ReadableStream<Uint8Array>,
  onActivity?: () => void
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines: string[] = [];
  let pendingCr = false;

  const flushEvent = () => {
    if (!dataLines.length) return undefined;
    const data = dataLines.join('\n');
    dataLines = [];
    return data;
  };

  const processLine = (line: string): string | undefined => {
    if (line === '') return flushEvent();
    if (line.startsWith(':')) return undefined;
    if (line.startsWith('data:')) {
      const value = line.slice(5);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
    return undefined;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value.byteLength > 0) {
        onActivity?.();
      }
      let text = decoder.decode(value, { stream: true });
      if (!text) continue;
      if (pendingCr) {
        pendingCr = false;
        if (text.startsWith('\n')) text = text.slice(1);
      }
      if (text.endsWith('\r')) {
        pendingCr = true;
        text = text.slice(0, -1);
      }
      buffer += text.replace(/\r\n?/g, '\n');
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const event = processLine(line);
        if (event !== undefined) yield event;
        newlineIndex = buffer.indexOf('\n');
      }
      if (pendingCr) {
        const event = processLine(buffer);
        buffer = '';
        if (event !== undefined) yield event;
      }
    }
    const trailing = decoder.decode();
    if (trailing) buffer += trailing.replace(/\r\n?/g, '\n');
    if (buffer.length > 0) {
      for (const line of buffer.split('\n')) {
        const event = processLine(line);
        if (event !== undefined) yield event;
      }
    }
    const finalEvent = flushEvent();
    if (finalEvent !== undefined) yield finalEvent;
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* Stream already closed or aborted. */
    }
    reader.releaseLock();
  }
}

function resolveBaseUrl(
  value: string | null,
  requestVersion: GeminiVersion
): {
  baseUrl: string;
  apiVersion: string;
  upstreamFormat: GeminiUpstreamFormat;
} {
  let url: URL;
  let pathname: string;
  let apiVersion: string = requestVersion;
  let upstreamFormat: GeminiUpstreamFormat = 'gemini';
  try {
    url = new URL(value || '');
    pathname = decodeURIComponent(url.pathname);
    if (
      /\/ai\/run\/?$/.test(url.pathname) &&
      /\/ai\/run\/?$/.test(pathname)
    ) {
      upstreamFormat = 'cloudflare-ai-run';
    } else {
      const version = url.pathname.match(/\/(v1|v1beta)\/?$/);
      if (version) {
        apiVersion = version[1];
        url.pathname = url.pathname.slice(0, -version[0].length);
        pathname = decodeURIComponent(url.pathname);
      }
    }
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
      'Gemini upstream base URL must use HTTP(S), optionally end in /v1, /v1beta, or /ai/run, and contain no credentials, query, fragment, or API action path.'
    );
  }
  try {
    parseAIGatewayUrl(url.toString());
  } catch (error) {
    throw failure(
      400,
      error instanceof Error
        ? error.message
        : 'Invalid Gemini upstream base URL.'
    );
  }
  return {
    baseUrl: url.toString().replace(/\/$/, ''),
    apiVersion,
    upstreamFormat,
  };
}

export function geminiError(code: number, message: string) {
  const statuses: Record<number, string> = {
    400: 'INVALID_ARGUMENT',
    401: 'UNAUTHENTICATED',
    402: 'FAILED_PRECONDITION',
    403: 'PERMISSION_DENIED',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    413: 'RESOURCE_EXHAUSTED',
    429: 'RESOURCE_EXHAUSTED',
    499: 'CANCELLED',
    500: 'INTERNAL',
    501: 'UNIMPLEMENTED',
    502: 'UNAVAILABLE',
    503: 'UNAVAILABLE',
    504: 'DEADLINE_EXCEEDED',
  };
  return { error: { code, status: statuses[code] ?? 'UNKNOWN', message } };
}

interface ParsedGeminiRequest {
  version: GeminiVersion;
  action: GeminiAction;
  requestedModel: string;
  stream: boolean;
  requestKey: string;
  body: GeminiRequestBody;
}

function parseGeminiRequest(req: Request, res: Response): ParsedGeminiRequest {
  const version = req.params.version;
  const path = req.params[0]; // Express decodes the entire slash-containing model once.
  const separator = path.lastIndexOf(':');
  const action = path.slice(separator + 1);
  if (
    (version !== 'v1' && version !== 'v1beta') ||
    separator < 0 ||
    (action !== 'generateContent' &&
      action !== 'streamGenerateContent' &&
      action !== 'countTokens')
  ) {
    throw failure(404, 'Gemini endpoint not found.');
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    throw failure(405, 'Use POST for this Gemini endpoint.');
  }
  const requestedModel = validateModel(path.slice(0, separator));
  const stream = action === 'streamGenerateContent';
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
  if (bearer && !/^Bearer\s+\S+$/i.test(bearer)) {
    throw failure(401, 'Invalid authorization header.');
  }
  const requestKey =
    req.get('x-goog-api-key')?.trim() ||
    bearer?.replace(/^Bearer\s+/i, '') ||
    '';
  if (bearer && bearer.replace(/^Bearer\s+/i, '') !== requestKey) {
    throw failure(400, 'Conflicting API keys.');
  }
  const parsedBody =
    action === 'countTokens'
      ? countSchema.safeParse(req.body)
      : generationSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw failure(400, 'Invalid or unsupported Gemini request fields.');
  }
  return {
    version,
    action,
    requestedModel,
    stream,
    requestKey,
    body: parsedBody.data,
  };
}

function mergeUsageMetadata(
  current: GeminiUsageMetadata,
  incoming: unknown
): GeminiUsageMetadata {
  if (!isRecord(incoming)) {
    throw failure(502, 'Invalid Gemini usage metadata.');
  }
  const nextUsage: GeminiUsageMetadata = { ...current, ...incoming };
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
        (!Number.isInteger(value) || value < 0 || value > MAX_PRISMA_INT32)
    ) ||
    (nextUsage.candidatesTokenCount ?? 0) +
      (nextUsage.thoughtsTokenCount ?? 0) >
      MAX_PRISMA_INT32
  ) {
    throw failure(502, 'Invalid Gemini usage metadata.');
  }
  return nextUsage;
}

interface GeminiResponseTracker {
  record(result: GenerateContentResponse): Record<string, unknown>;
  recordCountTokens(data: Record<string, unknown>): void;
  assertStreamCompleted(): void;
  getSummary(): {
    responses: object[];
    usage: GeminiUsageMetadata;
    ttft: number;
  };
}

function createGeminiResponseTracker(
  startedAt: number,
  resetIdle: () => void
): GeminiResponseTracker {
  const responses: object[] = [];
  const candidates = new Map<number, boolean>();
  let usage: GeminiUsageMetadata = {};
  let ttft = -1;
  let blocked = false;

  return {
    record(result) {
      const {
        sdkHttpResponse: _headers,
        candidates: sdkCandidates,
        ...rest
      } = result;
      if (
        sdkCandidates !== undefined &&
        (!Array.isArray(sdkCandidates) ||
          sdkCandidates.some((candidate) => !isRecord(candidate)))
      ) {
        throw failure(502, 'Invalid Gemini upstream response.');
      }
      const data = {
        ...rest,
        ...(sdkCandidates && {
          candidates: sdkCandidates.map(
            ({ citationMetadata, ...candidate }) => ({
              ...candidate,
              // The SDK renames this native field; restore it for downstream SDKs while preserving native REST responses.
              ...(isRecord(citationMetadata) && {
                citationMetadata: {
                  citationSources:
                    (citationMetadata as { citationSources?: unknown })
                      .citationSources ?? citationMetadata.citations,
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
      ) {
        ttft = Date.now() - startedAt;
      }
      for (const candidate of data.candidates ?? []) {
        const index = candidate.index ?? 0;
        candidates.set(
          index,
          candidates.get(index) === true || Boolean(candidate.finishReason)
        );
      }
      blocked ||= Boolean(data.promptFeedback?.blockReason);
      if (data.usageMetadata !== undefined) {
        usage = mergeUsageMetadata(usage, data.usageMetadata);
      }
      responses.push(data);
      return data;
    },
    recordCountTokens(data) {
      responses.push(data);
    },
    assertStreamCompleted() {
      if (
        !blocked &&
        (!candidates.size ||
          [...candidates.values()].some((finished) => !finished))
      ) {
        throw failure(502, 'Gemini upstream stream ended before completion.');
      }
    },
    getSummary() {
      return { responses, usage, ttft };
    },
  };
}

interface SseWriter {
  writeChunk(data: object, withKeepAlive?: boolean): Promise<void>;
  stop(): void;
}

function createSseWriter(res: Response, signal: AbortSignal): SseWriter {
  let stopKeepAlive: (() => void) | undefined;

  return {
    async writeChunk(data, withKeepAlive = true) {
      if (!res.headersSent) {
        setAIGatewayStreamHeaders(res);
        if (withKeepAlive) {
          stopKeepAlive = startAIGatewayStreamKeepAlive(res);
        }
      }
      const writable = res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.flush?.();
      if (!writable) {
        await once(res, 'drain', { signal });
      }
    },
    stop() {
      stopKeepAlive?.();
      stopKeepAlive = undefined;
    },
  };
}

async function readCloudflareHttpError(
  upstreamRes: globalThis.Response
): Promise<GeminiGatewayError> {
  const errorText = await upstreamRes.text().catch(() => '');
  let errorMessage = 'Gemini upstream request failed.';
  try {
    const extracted = extractCloudflareError(JSON.parse(errorText));
    if (extracted.message) errorMessage = extracted.message;
  } catch {
    /* Non-JSON error body. */
  }
  return failure(upstreamRes.status, errorMessage);
}

interface CloudflareUpstreamContext {
  req: Request;
  res: Response;
  baseUrl: string;
  upstreamKey: string;
  modelName: string;
  cloudflareInput: Omit<GenerationBody, 'model'>;
  cloudflareGatewayId?: string;
  stream: boolean;
  signal: AbortSignal;
  resetIdle: () => void;
  tracker: GeminiResponseTracker;
  sseWriter: SseWriter;
}

async function executeCloudflareUpstream(ctx: CloudflareUpstreamContext) {
  const upstreamRes = await fetchAIGatewayUrl(ctx.baseUrl, {
    method: 'POST',
    signal: ctx.signal,
    headers: {
      ...buildAIGatewayForwardHeaders(ctx.req),
      Authorization: `Bearer ${ctx.upstreamKey}`,
      'Content-Type': 'application/json',
      Accept: ctx.stream
        ? 'text/event-stream, application/json'
        : 'application/json',
      ...(ctx.cloudflareGatewayId && {
        'cf-aig-gateway-id': ctx.cloudflareGatewayId,
      }),
    },
    body: JSON.stringify({
      model: ctx.modelName,
      input: ctx.cloudflareInput,
    }),
  });
  if (!upstreamRes.ok) {
    throw await readCloudflareHttpError(upstreamRes);
  }
  const contentType =
    upstreamRes.headers
      .get('content-type')
      ?.split(';', 1)[0]
      .trim()
      .toLowerCase() ?? '';
  if (contentType === 'text/event-stream') {
    if (!ctx.stream || !upstreamRes.body) {
      throw failure(502, 'Invalid Gemini upstream response.');
    }
    for await (const rawEvent of iterateSseData(
      upstreamRes.body,
      ctx.resetIdle
    )) {
      if (rawEvent.trim() === '[DONE]') break;
      const chunk = parseCloudflareResponse(rawEvent);
      await ctx.sseWriter.writeChunk(ctx.tracker.record(chunk));
    }
    ctx.tracker.assertStreamCompleted();
    ctx.res.end();
    return;
  }
  const responseText = await upstreamRes.text();
  const data = ctx.tracker.record(parseCloudflareResponse(responseText));
  if (ctx.stream) {
    await ctx.sseWriter.writeChunk(data, false);
    ctx.res.end();
  } else {
    ctx.res.json(data);
  }
}

interface NativeGeminiUpstreamContext {
  req: Request;
  res: Response;
  baseUrl: string;
  apiVersion: string;
  upstreamKey: string;
  model: string;
  action: GeminiAction;
  body: GeminiRequestBody;
  stream: boolean;
  signal: AbortSignal;
  tracker: GeminiResponseTracker;
  sseWriter: SseWriter;
}

async function executeNativeGeminiUpstream(ctx: NativeGeminiUpstreamContext) {
  const ai = new GoogleGenAI({
    fetch: fetchAIGatewayUrl,
    apiKey: ctx.upstreamKey,
    vertexai: false,
    httpOptions: {
      baseUrl: ctx.baseUrl,
      apiVersion: ctx.apiVersion,
      timeout: GEMINI_TOTAL_TIMEOUT_MS,
      retryOptions: { attempts: 1 },
      headers: {
        ...buildAIGatewayForwardHeaders(ctx.req),
        // Custom Gemini relays may require Bearer authentication.
        ...(!new URL(ctx.baseUrl).hostname.endsWith('.googleapis.com') && {
          Authorization: `Bearer ${ctx.upstreamKey}`,
        }),
      },
    },
  });
  // REST schemas/signatures must not be rewritten by SDK's content/config converters.
  // extraBody is restricted to the validated REST envelope, never caller SDK options.
  const config = {
    abortSignal: ctx.signal,
    automaticFunctionCalling: { disable: true },
    httpOptions: { extraBody: ctx.body },
  };
  if (ctx.action === 'countTokens') {
    const result = await ai.models.countTokens({
      model: ctx.model,
      // The SDK supports omitted contents at runtime for native generateContentRequest.
      contents: (
        'contents' in ctx.body ? ctx.body.contents : undefined
      ) as Content[],
      config,
    });
    const { sdkHttpResponse: _headers, ...data } = result;
    if (!Number.isSafeInteger(data.totalTokens) || data.totalTokens! < 0) {
      throw failure(502, 'Invalid Gemini token count.');
    }
    ctx.tracker.recordCountTokens(data);
    ctx.res.json(data);
    return;
  }
  const params = {
    model: ctx.model,
    contents: ('contents' in ctx.body ? ctx.body.contents : []) as Content[],
    config,
  };
  if (ctx.stream) {
    const chunks = await ai.models.generateContentStream(params);
    for await (const chunk of chunks) {
      await ctx.sseWriter.writeChunk(ctx.tracker.record(chunk));
    }
    ctx.tracker.assertStreamCompleted();
    ctx.res.end();
    return;
  }
  ctx.res.json(ctx.tracker.record(await ai.models.generateContent(params)));
}

function normalizeGeminiError(
  caught: unknown,
  signal: AbortSignal,
  secrets: string[]
) {
  const error = signal.aborted ? signal.reason : caught;
  const rawStatus = (error as { status?: number })?.status;
  const status =
    Number.isInteger(rawStatus) && rawStatus! >= 400 && rawStatus! <= 599
      ? rawStatus!
      : 502;
  // SDK exceptions may contain the whole upstream payload. Never expose it or credentials.
  let message = rawStatus
    ? (error as Error).message
    : 'Gemini upstream request failed.';
  if (!(error instanceof GeminiGatewayError)) {
    try {
      message =
        JSON.parse(message).error?.message || 'Gemini upstream request failed.';
    } catch {
      /* Plain local error. */
    }
  }
  let safeMessage = String(message);
  for (const secret of secrets) {
    safeMessage = redactSecret(safeMessage, secret);
  }
  return {
    status,
    payload: geminiError(status, safeMessage),
  };
}

interface FinalizeGeminiLogContext {
  logId: string;
  workspaceId: string;
  gatewayId: string;
  gateway: AIGateway;
  action: GeminiAction;
  requestedModel: string;
  upstreamFormat: GeminiUpstreamFormat;
  stream: boolean;
  startedAt: number;
  tracker: GeminiResponseTracker;
  errorPayload?: ReturnType<typeof geminiError>;
}

async function finalizeGeminiLog(ctx: FinalizeGeminiLogContext) {
  const { responses, usage, ttft } = ctx.tracker.getSummary();
  const inputToken = usage.promptTokenCount ?? 0;
  const outputToken =
    (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
  const cacheReadInputToken = Math.min(
    inputToken,
    usage.cachedContentTokenCount ?? 0
  );
  const price =
    ctx.action === 'countTokens'
      ? new Prisma.Decimal(0)
      : calcAIGatewayCustomModelPrice({
          inputToken,
          outputToken,
          cacheReadInputToken,
          inputTokenIncludesCache: true,
          customModelStrategy: ctx.gateway.customModelStrategy,
          customModelInputPrice: ctx.gateway.customModelInputPrice,
          customModelOutputPrice: ctx.gateway.customModelOutputPrice,
        });
  const status = ctx.errorPayload ? 'Failed' : 'Success';
  const duration = Date.now() - ctx.startedAt;
  try {
    await prisma.aIGatewayLogs.update({
      where: { id: ctx.logId },
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
          stream: ctx.stream,
        }),
        price: price ?? 0,
        responsePayload: JSON.parse(
          JSON.stringify({
            response: ctx.stream ? responses : responses[0],
            usage,
            ...ctx.errorPayload,
            gateway: {
              protocol: 'gemini',
              action: ctx.action,
              requestedModel: ctx.requestedModel,
              ...(ctx.upstreamFormat === 'cloudflare-ai-run' && {
                upstreamFormat: ctx.upstreamFormat,
              }),
              usageSource:
                ctx.action === 'countTokens'
                  ? 'countTokens'
                  : Object.keys(usage).length
                    ? 'upstream'
                    : 'unknown',
              priceKnown:
                ctx.action === 'countTokens' ||
                (price !== null &&
                  usage.promptTokenCount !== undefined &&
                  usage.candidatesTokenCount !== undefined),
            },
          })
        ),
      },
    });
    if (price?.greaterThan(0)) {
      await checkQuotaAlert(ctx.workspaceId, ctx.gatewayId, Number(price));
    }
  } catch {
    logger.error('[Gemini Gateway] Failed to finalize request log', {
      logId: ctx.logId,
    });
  }
}

export const geminiHandler: RequestHandler = async (req, res) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let totalTimer: ReturnType<typeof setTimeout> | undefined;
  let logId: string | undefined;
  let gateway: AIGateway | undefined;
  let parsed: ParsedGeminiRequest | undefined;
  let upstreamKey = '';
  let upstreamFormat: GeminiUpstreamFormat = 'gemini';
  let errorPayload: ReturnType<typeof geminiError> | undefined;

  const disconnect = () => {
    if (!res.writableEnded) {
      controller.abort(failure(499, 'Client disconnected.'));
    }
  };
  res.on('close', disconnect);

  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => controller.abort(failure(504, 'Gemini upstream timed out.')),
      GEMINI_IDLE_TIMEOUT_MS
    );
    idleTimer.unref();
  };

  const tracker = createGeminiResponseTracker(startedAt, resetIdle);
  const sseWriter = createSseWriter(res, controller.signal);

  try {
    parsed = parseGeminiRequest(req, res);
    const resolved = await resolveAIGatewayModelApiKey({
      workspaceId: req.params.workspaceId,
      gatewayId: req.params.gatewayId,
      requestApiKey: parsed.requestKey,
    });
    gateway = resolved.gatewayInfo;
    upstreamKey = resolved.modelApiKey;

    const resolvedBase = resolveBaseUrl(
      gateway.customModelBaseUrl,
      parsed.version
    );
    upstreamFormat = resolvedBase.upstreamFormat;
    if (
      upstreamFormat === 'cloudflare-ai-run' &&
      parsed.action === 'countTokens'
    ) {
      throw failure(
        501,
        'countTokens is not supported for Cloudflare /ai/run upstreams.'
      );
    }

    const modelName =
      upstreamFormat === 'cloudflare-ai-run'
        ? resolveCloudflareModel(
            gateway.customModelName || parsed.requestedModel
          )
        : validateModel(gateway.customModelName || parsed.requestedModel);
    const model = `models/${modelName}`;

    let cloudflareInput: Omit<GenerationBody, 'model'> | undefined;
    if (upstreamFormat === 'cloudflare-ai-run') {
      const { model: _ignoredModel, ...rest } = parsed.body as GenerationBody;
      cloudflareInput = rest;
    } else {
      if ('generateContentRequest' in parsed.body) {
        parsed.body.generateContentRequest.model = model;
      }
      if ('model' in parsed.body) {
        parsed.body.model = model;
      }
    }

    const pending = trackAIGatewayPendingLog(
      req,
      createAIGatewayPendingLog({
        workspaceId: req.params.workspaceId,
        gatewayId: req.params.gatewayId,
        modelName,
        modelProvider: 'custom',
        stream: parsed.stream,
        userId: resolved.userId,
        requestPayload: {
          ...(cloudflareInput ?? parsed.body),
          gateway: {
            protocol: 'gemini' as const,
            action: parsed.action,
            requestedModel: parsed.requestedModel,
            ...(upstreamFormat === 'cloudflare-ai-run' && { upstreamFormat }),
          },
        },
      })
    );
    logId = (await pending).id;
    controller.signal.throwIfAborted();

    promAIGatewayRequestCounter.inc({ modelProvider: 'custom' });
    totalTimer = setTimeout(
      () => controller.abort(failure(504, 'Gemini upstream timed out.')),
      GEMINI_TOTAL_TIMEOUT_MS
    );
    totalTimer.unref();
    resetIdle();

    if (upstreamFormat === 'cloudflare-ai-run') {
      await executeCloudflareUpstream({
        req,
        res,
        baseUrl: resolvedBase.baseUrl,
        upstreamKey,
        modelName,
        cloudflareInput: cloudflareInput!,
        cloudflareGatewayId: resolveCloudflareGatewayId(
          gateway.customModelStrategy
        ),
        stream: parsed.stream,
        signal: controller.signal,
        resetIdle,
        tracker,
        sseWriter,
      });
    } else {
      await executeNativeGeminiUpstream({
        req,
        res,
        baseUrl: resolvedBase.baseUrl,
        apiVersion: resolvedBase.apiVersion,
        upstreamKey,
        model,
        action: parsed.action,
        body: parsed.body,
        stream: parsed.stream,
        signal: controller.signal,
        tracker,
        sseWriter,
      });
    }
  } catch (caught) {
    const normalized = normalizeGeminiError(caught, controller.signal, [
      parsed?.requestKey ?? '',
      upstreamKey,
    ]);
    errorPayload = normalized.payload;
    if (!res.destroyed && !res.writableEnded) {
      if (res.headersSent) {
        // Google GenAI recognizes raw error JSON in a stream. An SSE data:error event
        // is silently converted to an empty candidate by SDK 2.22.0.
        res.end(JSON.stringify(errorPayload));
      } else {
        res.status(normalized.status).json(errorPayload);
      }
    }
  } finally {
    clearTimeout(idleTimer);
    clearTimeout(totalTimer);
    sseWriter.stop();
    res.off('close', disconnect);
    controller.abort();
    if (logId && gateway && parsed) {
      await finalizeGeminiLog({
        logId,
        workspaceId: req.params.workspaceId,
        gatewayId: req.params.gatewayId,
        gateway,
        action: parsed.action,
        requestedModel: parsed.requestedModel,
        upstreamFormat,
        stream: parsed.stream,
        startedAt,
        tracker,
        errorPayload,
      });
    }
  }
};
