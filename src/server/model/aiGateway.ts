import { buildQueryWithCache } from '../cache/index.js';
import { prisma } from './_client.js';
import { type RequestHandler, type Request } from 'express';
import { calcMessagesToken, calcOpenAIToken } from '../model/openai.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { AIGatewayLogs, AIGatewayLogsStatus, Prisma } from '@prisma/client';
import { getLLMCostDecimalV2, getOpenRouterCostDecimal } from '../utils/llm.js';
import { get } from 'lodash-es';
import { verifyUserApiKey } from '../model/user.js';
import { checkQuotaAlert } from './aiGateway/quotaAlert.js';
import { logger } from '../utils/logger.js';
import { promAIGatewayRequestCounter } from '../utils/prometheus/client.js';

export const { get: getGatewayInfoCache, del: clearGatewayInfoCache } =
  buildQueryWithCache(
    'aiGatewayInfo',
    async (workspaceId: string, gatewayId: string) => {
      const gatewayInfo = await prisma.aIGateway.findUnique({
        where: {
          workspaceId,
          id: gatewayId,
        },
      });

      return gatewayInfo;
    }
  );

export function calcAIGatewayTpot(args: {
  stream: boolean;
  status: AIGatewayLogsStatus;
  duration: number;
  ttft: number;
  outputToken: number;
}) {
  if (!args.stream || args.status !== AIGatewayLogsStatus.Success) {
    return -1;
  }

  if (args.ttft < 0 || args.outputToken <= 1 || args.duration < args.ttft) {
    return -1;
  }

  return Math.max(
    1,
    Math.round((args.duration - args.ttft) / (args.outputToken - 1))
  );
}

type CustomModelPriceValue =
  | Prisma.Decimal
  | number
  | string
  | null
  | undefined;

type CustomModelPriceConfig = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toDecimal(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  try {
    return new Prisma.Decimal(value as any);
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getTierBoundary(
  price: CustomModelPriceConfig,
  keys: string[]
): number | null {
  for (const key of keys) {
    if (key in price) {
      return toNumber(price[key]);
    }
  }

  return null;
}

function isMatchingPriceTier(
  price: CustomModelPriceConfig,
  inputToken: number
) {
  const min =
    getTierBoundary(price, [
      'inputTokenMin',
      'inputTokenStart',
      'minInputToken',
    ]) ?? 0;
  const max = getTierBoundary(price, [
    'inputTokenMax',
    'inputTokenEnd',
    'maxInputToken',
  ]);

  return inputToken >= min && (max === null || inputToken <= max);
}

function resolveStrategyPrice(
  customModelStrategy: unknown,
  inputToken: number
): CustomModelPriceConfig | null {
  if (!isRecord(customModelStrategy)) {
    return null;
  }

  const price = customModelStrategy.price;

  if (Array.isArray(price)) {
    return (
      price.find(
        (item): item is CustomModelPriceConfig =>
          isRecord(item) && isMatchingPriceTier(item, inputToken)
      ) ?? null
    );
  }

  return isRecord(price) ? price : null;
}

function calcPriceFromConfig(args: {
  inputToken: number;
  outputToken: number;
  cacheReadInputToken?: number;
  cacheWriteInputToken?: number;
  price: CustomModelPriceConfig;
}): Prisma.Decimal | null {
  const inputPrice = toDecimal(args.price.input);
  const outputPrice = toDecimal(args.price.output);
  const cacheReadPrice = toDecimal(
    args.price.cacheRead ?? args.price.cache_read
  );
  const cacheWritePrice = toDecimal(
    args.price.cacheWrite ?? args.price.cache_write
  );

  if (!inputPrice && !outputPrice && !cacheReadPrice && !cacheWritePrice) {
    return null;
  }

  return new Prisma.Decimal(0)
    .add(inputPrice ? inputPrice.mul(args.inputToken).div(1_000_000) : 0)
    .add(outputPrice ? outputPrice.mul(args.outputToken).div(1_000_000) : 0)
    .add(
      cacheReadPrice
        ? cacheReadPrice.mul(args.cacheReadInputToken ?? 0).div(1_000_000)
        : 0
    )
    .add(
      cacheWritePrice
        ? cacheWritePrice.mul(args.cacheWriteInputToken ?? 0).div(1_000_000)
        : 0
    );
}

export function calcAIGatewayCustomModelPrice(args: {
  inputToken: number;
  outputToken: number;
  cacheReadInputToken?: number;
  cacheWriteInputToken?: number;
  customModelStrategy?: unknown;
  customModelInputPrice?: CustomModelPriceValue;
  customModelOutputPrice?: CustomModelPriceValue;
}): Prisma.Decimal | null {
  const strategyPrice = resolveStrategyPrice(
    args.customModelStrategy,
    args.inputToken
  );
  const strategyCost = strategyPrice
    ? calcPriceFromConfig({
        ...args,
        price: strategyPrice,
      })
    : null;

  if (strategyCost) {
    return strategyCost;
  }

  return calcPriceFromConfig({
    ...args,
    price: {
      input: args.customModelInputPrice,
      output: args.customModelOutputPrice,
    },
  });
}

export const openaiRequestSchema = z
  .object({
    model: z.string(),
    messages: z.array(z.any()).nonempty(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    max_tokens: z.number().int().optional(),
    stream: z.boolean().optional(),
    presence_penalty: z.number().optional(),
    frequency_penalty: z.number().optional(),
  })
  .passthrough();

export const openaiResponsesRequestSchema = z
  .object({
    model: z.string(),
    input: z.any(),
    stream: z.boolean().optional(),
  })
  .passthrough();

function readUsageNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }

  return 0;
}

export function getAIGatewayUsage(usage: any) {
  return {
    inputToken: readUsageNumber(usage?.input_tokens, usage?.prompt_tokens),
    outputToken: readUsageNumber(
      usage?.output_tokens,
      usage?.completion_tokens
    ),
    cacheReadInputToken: readUsageNumber(
      usage?.cache_read_input_tokens,
      usage?.input_tokens_details?.cached_tokens,
      usage?.input_token_details?.cached_tokens,
      usage?.prompt_tokens_details?.cached_tokens
    ),
    cacheWriteInputToken: readUsageNumber(
      usage?.cache_creation_input_tokens,
      usage?.cache_write_input_tokens,
      usage?.input_tokens_details?.cache_creation_tokens,
      usage?.input_tokens_details?.cache_write_tokens,
      usage?.input_token_details?.cache_creation_tokens,
      usage?.input_token_details?.cache_write_tokens,
      usage?.prompt_tokens_details?.cache_creation_tokens,
      usage?.prompt_tokens_details?.cache_write_tokens
    ),
  };
}

export function mergeAIGatewayStreamUsage(
  currentUsage: ReturnType<typeof getAIGatewayUsage>,
  usage: any
) {
  const nextUsage = getAIGatewayUsage(usage);

  return {
    inputToken: nextUsage.inputToken || currentUsage.inputToken,
    outputToken: nextUsage.outputToken || currentUsage.outputToken,
    cacheReadInputToken:
      nextUsage.cacheReadInputToken || currentUsage.cacheReadInputToken,
    cacheWriteInputToken:
      nextUsage.cacheWriteInputToken || currentUsage.cacheWriteInputToken,
  };
}

export function getOpenAIResponsesUsage(response: any) {
  return getAIGatewayUsage(response?.usage);
}

export function getOpenAIResponsesOutputText(response: any): string {
  if (typeof response?.output_text === 'string') {
    return response.output_text;
  }

  const output = Array.isArray(response?.output) ? response.output : [];
  return output
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((content: any) => {
      if (typeof content?.text === 'string') {
        return content.text;
      }

      if (typeof content?.text?.value === 'string') {
        return content.text.value;
      }

      return '';
    })
    .join('');
}

export function getOpenAIResponsesStreamDelta(event: any): string {
  if (
    event?.type === 'response.output_text.delta' &&
    typeof event.delta === 'string'
  ) {
    return event.delta;
  }

  return '';
}

export function getOpenAIResponsesCompletedResponse(event: any) {
  if (
    (event?.type === 'response.completed' || event?.type === 'response.done') &&
    event.response
  ) {
    return event.response;
  }

  return undefined;
}

function stringifyResponseInput(input: unknown): string {
  return typeof input === 'string' ? input : JSON.stringify(input);
}

export type AIGatewayProtocol =
  | 'openai-chat'
  | 'openai-responses'
  | 'anthropic-messages';

export interface AIGatewayAttemptFailure {
  statusCode?: number;
  errorType: 'network' | 'timeout' | 'upstream' | 'unknown';
  message: string;
  responseBody?: unknown;
}

export interface AIGatewayAttemptResult {
  ok: boolean;
  committed: boolean;
  logId?: string;
  gatewayId: string;
  statusCode?: number;
  failure?: AIGatewayAttemptFailure;
}

export interface AIGatewayAttemptRuntimeOptions {
  workspaceId: string;
  gatewayId: string;
  payloadOverride?: Record<string, unknown>;
  deferErrorResponse?: boolean;
  timeoutMs?: number;
}

export type AIGatewayLogCreatedCallback = (log: AIGatewayLogs) => void;

export interface AIGatewayLogAwareRequest extends Request {
  __onAIGatewayLogCreated?: AIGatewayLogCreatedCallback;
  __aiGatewayLogPromise?: Promise<AIGatewayLogs>;
}

interface OpenaiHandlerOptions {
  baseUrl?: string;
  modelProvider?: string;
  modelPriceName?: (model: string) => string;
  isCustomRoute?: boolean;
  header?: (req: Request) => Record<string, string>;
}

export async function resolveAIGatewayModelApiKey(args: {
  workspaceId: string;
  gatewayId: string;
  requestApiKey: string;
}) {
  const gatewayInfo = await getGatewayInfoCache(args.workspaceId, args.gatewayId);
  let modelApiKey = args.requestApiKey;
  let userId: string | null = null;

  if (gatewayInfo?.modelApiKey) {
    const user = await verifyUserApiKey(args.requestApiKey);
    userId = user.id;
    modelApiKey = gatewayInfo.modelApiKey;
  }

  return {
    gatewayInfo,
    modelApiKey,
    userId,
  };
}

export async function createAIGatewayPendingLog(args: {
  workspaceId: string;
  gatewayId: string;
  modelName: string;
  modelProvider: string;
  stream: boolean | undefined;
  requestPayload: unknown;
  userId: string | null;
}): Promise<AIGatewayLogs> {
  return prisma.aIGatewayLogs.create({
    data: {
      workspaceId: args.workspaceId,
      gatewayId: args.gatewayId,
      modelName: args.modelName,
      modelProvider: args.modelProvider,
      stream: args.stream,
      inputToken: 0,
      outputToken: 0,
      cacheReadInputToken: 0,
      cacheWriteInputToken: 0,
      duration: 0,
      ttft: 0,
      tpot: -1,
      requestPayload: args.requestPayload as any,
      responsePayload: {},
      userId: args.userId,
      status: AIGatewayLogsStatus.Pending,
    },
  });
}

export function getAIGatewayErrorStatusCode(error: unknown): number {
  const status = get(error, 'status', 500);

  return typeof status === 'number' ? status : 500;
}

export function notifyAIGatewayLogCreated(req: Request, log: AIGatewayLogs) {
  const callback = (req as AIGatewayLogAwareRequest).__onAIGatewayLogCreated;

  if (!callback) {
    return;
  }

  try {
    callback(log);
  } catch (error) {
    logger.warn('[ai-gateway] log-created callback failed', error);
  }
}

export function trackAIGatewayPendingLog(
  req: Request,
  logPromise: Promise<AIGatewayLogs>
): Promise<AIGatewayLogs> {
  const trackedLogPromise = logPromise.then((log) => {
    notifyAIGatewayLogCreated(req, log);
    return log;
  });

  (req as AIGatewayLogAwareRequest).__aiGatewayLogPromise = trackedLogPromise;

  return trackedLogPromise;
}

export function buildOpenAIHandler(
  options: OpenaiHandlerOptions
): RequestHandler {
  return async (req, res) => {
    const payload = openaiRequestSchema.parse(req.body);
    const { messages, stream } = payload;
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);
    const apiKey = (req.headers.authorization ?? '').replace('Bearer ', '');
    const { gatewayInfo, modelApiKey, userId } =
      await resolveAIGatewayModelApiKey({
        workspaceId,
        gatewayId,
        requestApiKey: apiKey,
      });

    // Use custom settings from gateway if available
    const baseUrl =
      options.isCustomRoute && gatewayInfo?.customModelBaseUrl
        ? gatewayInfo?.customModelBaseUrl
        : options.baseUrl;
    const modelName =
      options.isCustomRoute && gatewayInfo?.customModelName
        ? gatewayInfo?.customModelName
        : payload.model;

    const start = Date.now();
    const modelProvider =
      options.modelProvider ?? (options.isCustomRoute ? 'custom' : 'openai');

    const logP = trackAIGatewayPendingLog(
      req,
      createAIGatewayPendingLog({
        workspaceId,
        gatewayId,
        modelName,
        modelProvider,
        stream,
        requestPayload: payload,
        userId,
      })
    );

    try {
      const openai = new OpenAI({
        apiKey: modelApiKey,
        baseURL: baseUrl,
        defaultHeaders: options.header?.(req),
      });
      const modelPriceName = options.modelPriceName
        ? options.modelPriceName(modelName)
        : modelName;

      // Record request count with model provider label
      promAIGatewayRequestCounter.inc({ modelProvider });

      // Create payload with custom model name if specified
      const requestPayload = {
        ...payload,
        model: modelName,
      };

      // Handle stream response
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
          ...requestPayload,
          stream: true,
        });

        let outputContent = '';
        let ttft = -1;
        let usage: OpenAI.Completions.CompletionUsage = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };
        let openrouterProviderName = ''; // only for open router, as for different openrouter provider, its will have different price.
        let responseModelName = modelName; // real model name which returned from remote. its will be some changed because of the model alias.
        for await (const chunk of stream) {
          responseModelName = chunk.model;
          if (ttft === -1) {
            ttft = Date.now() - start;
          }
          const content = get(chunk, ['choices', 0, 'delta', 'content']) || '';
          outputContent += content;
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);

          if (chunk.usage) {
            usage = chunk.usage; // try to get usage from chunk
          }

          if ('provider' in chunk) {
            openrouterProviderName = String(chunk.provider);
          }

          if (res.flush) {
            res.flush();
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const normalizedUsage = getAIGatewayUsage(usage);
          const [inputToken, outputToken] = await Promise.all([
            normalizedUsage.inputToken ||
              calcMessagesToken(messages, modelName),
            normalizedUsage.outputToken ||
              calcOpenAIToken(outputContent, modelName),
          ]);

          const cacheReadInputToken = normalizedUsage.cacheReadInputToken;
          const cacheWriteInputToken = normalizedUsage.cacheWriteInputToken;

          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken,
                outputToken,
                cacheReadInputToken,
                cacheWriteInputToken,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;

          const responseCost = get(usage, 'cost');
          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : modelProvider === 'openrouter' &&
                  Boolean(openrouterProviderName)
                ? await getOpenRouterCostDecimal(
                    responseModelName,
                    openrouterProviderName,
                    inputToken,
                    outputToken
                  )
                : customPrice
                  ? customPrice
                  : getLLMCostDecimalV2(
                      modelProvider,
                      modelPriceName,
                      inputToken,
                      outputToken,
                      cacheReadInputToken,
                      cacheWriteInputToken
                    );
          const tpot = calcAIGatewayTpot({
            stream: true,
            status: AIGatewayLogsStatus.Success,
            duration,
            ttft,
            outputToken,
          });

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              modelName: responseModelName,
              inputToken,
              outputToken,
              cacheReadInputToken,
              cacheWriteInputToken,
              duration,
              ttft,
              tpot,
              price,
              responsePayload: {
                content: outputContent,
                usage,
                provider: openrouterProviderName,
              },
            },
          });

          // Check quota alert after successful request
          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      } else {
        // Handle normal response
        const response = await openai.chat.completions.create({
          ...requestPayload,
          stream: false,
        });

        const responseModelName = response.model ?? modelName;
        const openrouterProviderName = get(response, 'provider', '');

        res.json(response);
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const content = get(response, ['choices', 0, 'message', 'content']);
          const normalizedUsage = getAIGatewayUsage(response.usage);

          const [inputToken, outputToken] = await Promise.all([
            normalizedUsage.inputToken ||
              calcMessagesToken(messages, modelName),
            normalizedUsage.outputToken ||
              (typeof content === 'string'
                ? calcOpenAIToken(content, modelName)
                : Promise.resolve(0)),
          ]);

          const cacheReadInputToken = normalizedUsage.cacheReadInputToken;
          const cacheWriteInputToken = normalizedUsage.cacheWriteInputToken;

          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken,
                outputToken,
                cacheReadInputToken,
                cacheWriteInputToken,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;

          const responseCost = get(response, ['usage', 'cost']);
          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : modelProvider === 'openrouter' &&
                  Boolean(openrouterProviderName)
                ? await getOpenRouterCostDecimal(
                    responseModelName,
                    openrouterProviderName,
                    inputToken,
                    outputToken
                  )
                : customPrice
                  ? customPrice
                  : getLLMCostDecimalV2(
                      modelProvider,
                      modelPriceName,
                      inputToken,
                      outputToken,
                      cacheReadInputToken,
                      cacheWriteInputToken
                    );

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              inputToken,
              outputToken,
              cacheReadInputToken,
              cacheWriteInputToken,
              duration,
              modelName: responseModelName,
              price,
              responsePayload: { ...response },
            },
          });

          // Check quota alert after successful request
          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      }
    } catch (error) {
      // Handle API error
      console.error('OpenAI API error:', error);
      const status = getAIGatewayErrorStatusCode(error);
      res.status(status).json({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'server_error',
        },
      });

      const duration = Date.now() - start;
      logP.then(async ({ id: logId }) => {
        await prisma.aIGatewayLogs.update({
          where: {
            id: logId,
          },
          data: {
            status: AIGatewayLogsStatus.Failed,
            duration,
            responsePayload: {
              error: String(error),
            },
          },
        });
      });
    }
  };
}

export function buildOpenAIResponsesHandler(
  options: OpenaiHandlerOptions
): RequestHandler {
  return async (req, res) => {
    const payload = openaiResponsesRequestSchema.parse(req.body);
    const { stream } = payload;
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);
    const apiKey = (req.headers.authorization ?? '').replace('Bearer ', '');
    const { gatewayInfo, modelApiKey, userId } =
      await resolveAIGatewayModelApiKey({
        workspaceId,
        gatewayId,
        requestApiKey: apiKey,
      });

    const baseUrl =
      options.isCustomRoute && gatewayInfo?.customModelBaseUrl
        ? gatewayInfo?.customModelBaseUrl
        : options.baseUrl;
    const modelName =
      options.isCustomRoute && gatewayInfo?.customModelName
        ? gatewayInfo?.customModelName
        : payload.model;

    const start = Date.now();
    const modelProvider =
      options.modelProvider ?? (options.isCustomRoute ? 'custom' : 'openai');

    const logP = trackAIGatewayPendingLog(
      req,
      createAIGatewayPendingLog({
        workspaceId,
        gatewayId,
        modelName,
        modelProvider,
        stream: Boolean(stream),
        requestPayload: payload,
        userId,
      })
    );

    try {
      const openai = new OpenAI({
        apiKey: modelApiKey,
        baseURL: baseUrl,
        defaultHeaders: options.header?.(req),
      });
      const modelPriceName = options.modelPriceName
        ? options.modelPriceName(modelName)
        : modelName;

      promAIGatewayRequestCounter.inc({ modelProvider });

      const requestPayload = {
        ...payload,
        model: modelName,
      };

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const responseStream = await (openai as any).responses.create({
          ...requestPayload,
          stream: true,
        });

        let outputContent = '';
        let ttft = -1;
        let completedResponse: any;
        let responseModelName = modelName;

        for await (const event of responseStream) {
          if (ttft === -1) {
            ttft = Date.now() - start;
          }

          outputContent += getOpenAIResponsesStreamDelta(event);
          const response = getOpenAIResponsesCompletedResponse(event);
          if (response) {
            completedResponse = response;
            responseModelName = response.model ?? responseModelName;
          }

          res.write(`data: ${JSON.stringify(event)}\n\n`);

          if (res.flush) {
            res.flush();
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const finalOutputContent =
            getOpenAIResponsesOutputText(completedResponse) || outputContent;
          const usage = getOpenAIResponsesUsage(completedResponse);
          const [inputToken, outputToken] = await Promise.all([
            usage.inputToken ||
              calcOpenAIToken(stringifyResponseInput(payload.input), modelName),
            usage.outputToken || calcOpenAIToken(finalOutputContent, modelName),
          ]);

          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken,
                outputToken,
                cacheReadInputToken: usage.cacheReadInputToken,
                cacheWriteInputToken: usage.cacheWriteInputToken,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;
          const price = customPrice
            ? customPrice
            : getLLMCostDecimalV2(
                modelProvider,
                modelPriceName,
                inputToken,
                outputToken,
                usage.cacheReadInputToken,
                usage.cacheWriteInputToken
              );
          const tpot = calcAIGatewayTpot({
            stream: true,
            status: AIGatewayLogsStatus.Success,
            duration,
            ttft,
            outputToken,
          });

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              modelName: responseModelName,
              inputToken,
              outputToken,
              cacheReadInputToken: usage.cacheReadInputToken,
              cacheWriteInputToken: usage.cacheWriteInputToken,
              duration,
              ttft,
              tpot,
              price,
              responsePayload: {
                content: finalOutputContent,
                response: completedResponse ?? {},
              },
            },
          });

          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      } else {
        const response = await (openai as any).responses.create({
          ...requestPayload,
          stream: false,
        });

        const responseModelName = response.model ?? modelName;

        res.json(response);
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const outputContent = getOpenAIResponsesOutputText(response);
          const usage = getOpenAIResponsesUsage(response);
          const [inputToken, outputToken] = await Promise.all([
            usage.inputToken ||
              calcOpenAIToken(stringifyResponseInput(payload.input), modelName),
            usage.outputToken || calcOpenAIToken(outputContent, modelName),
          ]);

          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken,
                outputToken,
                cacheReadInputToken: usage.cacheReadInputToken,
                cacheWriteInputToken: usage.cacheWriteInputToken,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;
          const price = customPrice
            ? customPrice
            : getLLMCostDecimalV2(
                modelProvider,
                modelPriceName,
                inputToken,
                outputToken,
                usage.cacheReadInputToken,
                usage.cacheWriteInputToken
              );

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              inputToken,
              outputToken,
              cacheReadInputToken: usage.cacheReadInputToken,
              cacheWriteInputToken: usage.cacheWriteInputToken,
              duration,
              modelName: responseModelName,
              price,
              responsePayload: { ...response },
            },
          });

          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      }
    } catch (error) {
      console.error('OpenAI Responses API error:', error);
      res.status(getAIGatewayErrorStatusCode(error)).json({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'server_error',
        },
      });

      const duration = Date.now() - start;
      logP.then(async ({ id: logId }) => {
        await prisma.aIGatewayLogs.update({
          where: {
            id: logId,
          },
          data: {
            status: AIGatewayLogsStatus.Failed,
            duration,
            responsePayload: {
              error: String(error),
            },
          },
        });
      });
    }
  };
}

interface ModelsHandlerOptions {
  baseUrl?: string;
  isCustomRoute?: boolean;
  header?: (req: Request) => Record<string, string>;
}

/**
 * Forward the OpenAI-compatible `GET /v1/models` endpoint so external clients
 * can discover available models through the gateway.
 */
export function buildOpenAIModelsHandler(
  options: ModelsHandlerOptions
): RequestHandler {
  return async (req, res) => {
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);

    const apiKey = (req.headers.authorization ?? '').replace('Bearer ', '');
    let modelApiKey = apiKey;
    const gatewayInfo = await getGatewayInfoCache(workspaceId, gatewayId);
    if (gatewayInfo?.modelApiKey) {
      await verifyUserApiKey(apiKey);
      modelApiKey = gatewayInfo.modelApiKey;
    }

    const baseUrl =
      options.isCustomRoute && gatewayInfo?.customModelBaseUrl
        ? gatewayInfo?.customModelBaseUrl
        : options.baseUrl;

    try {
      const openai = new OpenAI({
        apiKey: modelApiKey,
        baseURL: baseUrl,
        defaultHeaders: options.header?.(req),
      });

      const list = await openai.models.list();

      res.json({
        object: 'list',
        data: list.data,
      });
    } catch (error) {
      console.error('OpenAI models API error:', error);
      const status = get(error, 'status', 500) as number;
      res.status(typeof status === 'number' ? status : 500).json({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'server_error',
        },
      });
    }
  };
}

/**
 * Forward the native Anthropic `GET /v1/models` endpoint. Anthropic requires the
 * `x-api-key` and `anthropic-version` headers instead of a Bearer token.
 */
export function buildAnthropicModelsHandler(
  options: ModelsHandlerOptions
): RequestHandler {
  return async (req, res) => {
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);

    const apiKey =
      (req.headers['x-api-key'] as string) ??
      (req.headers.authorization ?? '').replace('Bearer ', '');
    let modelApiKey = apiKey;
    const gatewayInfo = await getGatewayInfoCache(workspaceId, gatewayId);
    if (gatewayInfo?.modelApiKey) {
      await verifyUserApiKey(apiKey);
      modelApiKey = gatewayInfo.modelApiKey;
    }

    const baseUrl =
      options.isCustomRoute && gatewayInfo?.customModelBaseUrl
        ? gatewayInfo?.customModelBaseUrl
        : options.baseUrl;

    try {
      const queryString = new URLSearchParams(
        req.query as Record<string, string>
      ).toString();
      const upstreamUrl = `${baseUrl}/models${
        queryString ? `?${queryString}` : ''
      }`;
      const anthropicVersion =
        (req.headers['anthropic-version'] as string) ||
        DEFAULT_ANTHROPIC_VERSION;

      const headers: Record<string, string> = {
        'content-type': 'application/json',
        'x-api-key': modelApiKey,
        'anthropic-version': anthropicVersion,
        ...options.header?.(req),
      };

      const betaHeader = req.headers['anthropic-beta'];
      if (betaHeader) {
        headers['anthropic-beta'] = String(betaHeader);
      }

      const upstreamResponse = await fetch(upstreamUrl, {
        method: 'GET',
        headers,
      });

      const body = await upstreamResponse.text();
      res.status(upstreamResponse.status);
      res.setHeader(
        'content-type',
        upstreamResponse.headers.get('content-type') || 'application/json'
      );
      res.end(body);
    } catch (error) {
      console.error('Anthropic models proxy error:', error);
      res.status(500).json({
        type: 'error',
        error: {
          type: 'server_error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };
}

export const anthropicRequestSchema = z
  .object({
    model: z.string(),
    messages: z.array(z.any()).nonempty(),
    max_tokens: z.number().int(),
    stream: z.boolean().optional(),
  })
  .passthrough();

const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicHandlerOptions {
  baseUrl?: string;
  modelProvider?: string;
  isCustomRoute?: boolean;
  header?: (req: Request) => Record<string, string>;
}

export function buildAnthropicHandler(
  options: AnthropicHandlerOptions
): RequestHandler {
  return async (req, res) => {
    const payload = anthropicRequestSchema.parse(req.body);
    const { stream } = payload;
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);

    // Anthropic uses x-api-key header, fall back to Authorization Bearer
    const apiKey =
      (req.headers['x-api-key'] as string) ??
      (req.headers.authorization ?? '').replace('Bearer ', '');
    const { gatewayInfo, modelApiKey, userId } =
      await resolveAIGatewayModelApiKey({
        workspaceId,
        gatewayId,
        requestApiKey: apiKey,
      });

    const baseUrl =
      options.isCustomRoute && gatewayInfo?.customModelBaseUrl
        ? gatewayInfo?.customModelBaseUrl
        : options.baseUrl;
    const modelName =
      options.isCustomRoute && gatewayInfo?.customModelName
        ? gatewayInfo?.customModelName
        : payload.model;

    const start = Date.now();
    const modelProvider =
      options.modelProvider ?? (options.isCustomRoute ? 'custom' : 'anthropic');

    const logP = trackAIGatewayPendingLog(
      req,
      createAIGatewayPendingLog({
        workspaceId,
        gatewayId,
        modelName,
        modelProvider,
        stream,
        requestPayload: payload,
        userId,
      })
    );

    try {
      promAIGatewayRequestCounter.inc({ modelProvider });

      const upstreamUrl = `${baseUrl}/messages`;
      const anthropicVersion =
        (req.headers['anthropic-version'] as string) ||
        DEFAULT_ANTHROPIC_VERSION;

      const requestPayload = {
        ...payload,
        model: modelName,
      };

      const headers: Record<string, string> = {
        'content-type': 'application/json',
        'x-api-key': modelApiKey,
        'anthropic-version': anthropicVersion,
        ...options.header?.(req),
      };

      // Forward anthropic-beta header if present
      const betaHeader = req.headers['anthropic-beta'];
      if (betaHeader) {
        headers['anthropic-beta'] = String(betaHeader);
      }

      const upstreamResponse = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      });

      if (!upstreamResponse.ok) {
        const errorBody = await upstreamResponse.text();
        res.status(upstreamResponse.status);
        res.setHeader(
          'content-type',
          upstreamResponse.headers.get('content-type') || 'application/json'
        );
        res.end(errorBody);

        const duration = Date.now() - start;
        logP.then(async ({ id: logId }) => {
          await prisma.aIGatewayLogs.update({
            where: { id: logId },
            data: {
              status: AIGatewayLogsStatus.Failed,
              duration,
              responsePayload: { error: errorBody },
            },
          });
        });
        return;
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let inputTokens = 0;
        let outputTokens = 0;
        let cacheReadInputTokens = 0;
        let cacheWriteInputTokens = 0;
        let outputContent = '';
        let ttft = -1;
        let responseModelName = modelName;
        let responseCost: number | undefined;
        let usage: Record<string, any> | undefined;
        let streamUsage = getAIGatewayUsage(undefined);

        const body = upstreamResponse.body;
        if (!body) {
          throw new Error('No response body from upstream');
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            // Write raw SSE data directly to client
            res.write(text);
            if (res.flush) {
              res.flush();
            }

            // Parse SSE events from buffer for usage extraction
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEventType = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEventType = line.slice(7).trim();
              } else if (line.startsWith('data: ') && currentEventType) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (currentEventType === 'message_start' && data.message) {
                    responseModelName = data.message.model || responseModelName;
                    usage = {
                      ...(usage ?? {}),
                      ...(data.message.usage ?? {}),
                    };
                    streamUsage = mergeAIGatewayStreamUsage(
                      streamUsage,
                      data.message.usage
                    );
                    inputTokens = streamUsage.inputToken;
                    outputTokens = streamUsage.outputToken;
                    cacheReadInputTokens = streamUsage.cacheReadInputToken;
                    cacheWriteInputTokens = streamUsage.cacheWriteInputToken;
                    responseCost = data.message.usage?.cost ?? responseCost;
                  } else if (currentEventType === 'content_block_delta') {
                    if (ttft === -1) {
                      ttft = Date.now() - start;
                    }
                    if (data.delta?.type === 'text_delta') {
                      outputContent += data.delta.text || '';
                    }
                  } else if (currentEventType === 'message_delta') {
                    usage = {
                      ...(usage ?? {}),
                      ...(data.usage ?? {}),
                    };
                    streamUsage = mergeAIGatewayStreamUsage(
                      streamUsage,
                      data.usage
                    );
                    inputTokens = streamUsage.inputToken;
                    outputTokens = streamUsage.outputToken;
                    cacheReadInputTokens = streamUsage.cacheReadInputToken;
                    cacheWriteInputTokens = streamUsage.cacheWriteInputToken;
                    responseCost = data.usage?.cost ?? responseCost;
                  }
                } catch {
                  // Skip non-JSON data lines
                }
                currentEventType = '';
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        res.end();
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken: inputTokens,
                outputToken: outputTokens,
                cacheReadInputToken: cacheReadInputTokens,
                cacheWriteInputToken: cacheWriteInputTokens,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;

          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : customPrice
                ? customPrice
                : getLLMCostDecimalV2(
                    modelProvider,
                    modelName,
                    inputTokens,
                    outputTokens,
                    cacheReadInputTokens,
                    cacheWriteInputTokens
                  );
          const tpot = calcAIGatewayTpot({
            stream: true,
            status: AIGatewayLogsStatus.Success,
            duration,
            ttft,
            outputToken: outputTokens,
          });

          await prisma.aIGatewayLogs.update({
            where: { id: logId },
            data: {
              status: AIGatewayLogsStatus.Success,
              modelName: responseModelName,
              inputToken: inputTokens,
              outputToken: outputTokens,
              cacheReadInputToken: cacheReadInputTokens,
              cacheWriteInputToken: cacheWriteInputTokens,
              duration,
              ttft,
              tpot,
              price,
              responsePayload: {
                content: outputContent,
                usage: {
                  ...usage,
                },
              },
            },
          });

          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      } else {
        const responseBody = await upstreamResponse.json();

        res.json(responseBody);
        const duration = Date.now() - start;

        logP.then(async ({ id: logId }) => {
          const responseModelName = responseBody.model || modelName;
          const usage = responseBody.usage;
          const normalizedUsage = getAIGatewayUsage(usage);
          const inputTokens = normalizedUsage.inputToken;
          const outputTokens = normalizedUsage.outputToken;
          const cacheReadInputTokens = normalizedUsage.cacheReadInputToken;
          const cacheWriteInputTokens = normalizedUsage.cacheWriteInputToken;
          const responseCost = usage?.cost;

          const contentBlocks = responseBody.content || [];
          const outputContent = contentBlocks
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('');

          const customPrice = options.isCustomRoute
            ? calcAIGatewayCustomModelPrice({
                inputToken: inputTokens,
                outputToken: outputTokens,
                cacheReadInputToken: cacheReadInputTokens,
                cacheWriteInputToken: cacheWriteInputTokens,
                customModelStrategy: gatewayInfo?.customModelStrategy,
                customModelInputPrice: gatewayInfo?.customModelInputPrice,
                customModelOutputPrice: gatewayInfo?.customModelOutputPrice,
              })
            : null;

          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : customPrice
                ? customPrice
                : getLLMCostDecimalV2(
                    modelProvider,
                    modelName,
                    inputTokens,
                    outputTokens,
                    cacheReadInputTokens,
                    cacheWriteInputTokens
                  );

          await prisma.aIGatewayLogs.update({
            where: { id: logId },
            data: {
              status: AIGatewayLogsStatus.Success,
              modelName: responseModelName,
              inputToken: inputTokens,
              outputToken: outputTokens,
              cacheReadInputToken: cacheReadInputTokens,
              cacheWriteInputToken: cacheWriteInputTokens,
              duration,
              price,
              responsePayload: {
                content: outputContent,
                usage,
              },
            },
          });

          checkQuotaAlert(workspaceId, gatewayId, Number(price)).catch(
            (error) => {
              logger.error('Error checking quota alert:', error);
            }
          );
        });
      }
    } catch (error) {
      console.error('Anthropic proxy error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          type: 'error',
          error: {
            type: 'server_error',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      const duration = Date.now() - start;
      logP.then(async ({ id: logId }) => {
        await prisma.aIGatewayLogs.update({
          where: { id: logId },
          data: {
            status: AIGatewayLogsStatus.Failed,
            duration,
            responsePayload: { error: String(error) },
          },
        });
      });
    }
  };
}
