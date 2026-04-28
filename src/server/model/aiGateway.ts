import { buildQueryWithCache } from '../cache/index.js';
import { prisma } from './_client.js';
import { type RequestHandler, type Request } from 'express';
import { calcMessagesToken, calcOpenAIToken } from '../model/openai.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { AIGatewayLogs, AIGatewayLogsStatus, Prisma } from '@prisma/client';
import {
  getLLMCostDecimalV2,
  getLLMCostDecimalWithCustomPrice,
  getOpenRouterCostDecimal,
} from '../utils/llm.js';
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

const openaiRequestSchema = z
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

interface OpenaiHandlerOptions {
  baseUrl?: string;
  modelProvider?: string;
  modelPriceName?: (model: string) => string;
  isCustomRoute?: boolean;
  header?: (req: Request) => Record<string, string>;
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
    let modelApiKey = apiKey;
    const gatewayInfo = await getGatewayInfoCache(workspaceId, gatewayId);
    let userId: string | null = null;
    if (gatewayInfo?.modelApiKey) {
      const user = await verifyUserApiKey(apiKey);
      userId = user.id;
      modelApiKey = gatewayInfo.modelApiKey;
    }

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

    const logP = new Promise<AIGatewayLogs>(async (resolve) => {
      const _log = await prisma.aIGatewayLogs.create({
        data: {
          workspaceId,
          gatewayId,
          modelName,
          modelProvider,
          stream,
          inputToken: 0,
          outputToken: 0,
          cacheReadInputToken: 0,
          cacheWriteInputToken: 0,
          duration: 0,
          ttft: 0,
          requestPayload: payload,
          responsePayload: {},
          userId,
          status: AIGatewayLogsStatus.Pending,
        },
      });

      resolve(_log);
    });

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
          const [inputToken, outputToken] = await Promise.all([
            usage.prompt_tokens ?? calcMessagesToken(messages, modelName),
            usage.completion_tokens ??
              calcOpenAIToken(outputContent, modelName),
          ]);

          const cacheReadInputToken =
            get(usage, ['prompt_tokens_details', 'cached_tokens']) ?? 0;
          const cacheWriteInputToken = 0;

          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;

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
                : options.isCustomRoute &&
                    (customInputPrice || customOutputPrice)
                  ? getLLMCostDecimalWithCustomPrice(
                      inputToken,
                      outputToken,
                      customInputPrice,
                      customOutputPrice
                    )
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
              modelName: responseModelName,
              inputToken,
              outputToken,
              cacheReadInputToken,
              cacheWriteInputToken,
              duration,
              ttft,
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

          const [inputToken, outputToken] = await Promise.all([
            response.usage?.prompt_tokens ??
              calcMessagesToken(messages, modelName),
            response.usage?.completion_tokens ??
              (typeof content === 'string'
                ? calcOpenAIToken(content, modelName)
                : Promise.resolve(0)),
          ]);

          const cacheReadInputToken =
            response.usage?.prompt_tokens_details?.cached_tokens ?? 0;
          const cacheWriteInputToken = 0;

          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;

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
                : options.isCustomRoute &&
                    (customInputPrice || customOutputPrice)
                  ? getLLMCostDecimalWithCustomPrice(
                      inputToken,
                      outputToken,
                      customInputPrice,
                      customOutputPrice
                    )
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
      res.status(500).json({
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

const anthropicRequestSchema = z
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
    let modelApiKey = apiKey;
    const gatewayInfo = await getGatewayInfoCache(workspaceId, gatewayId);
    let userId: string | null = null;
    if (gatewayInfo?.modelApiKey) {
      const user = await verifyUserApiKey(apiKey);
      userId = user.id;
      modelApiKey = gatewayInfo.modelApiKey;
    }

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

    const logP = new Promise<AIGatewayLogs>(async (resolve) => {
      const _log = await prisma.aIGatewayLogs.create({
        data: {
          workspaceId,
          gatewayId,
          modelName,
          modelProvider,
          stream,
          inputToken: 0,
          outputToken: 0,
          cacheReadInputToken: 0,
          cacheWriteInputToken: 0,
          duration: 0,
          ttft: 0,
          requestPayload: payload,
          responsePayload: {},
          userId,
          status: AIGatewayLogsStatus.Pending,
        },
      });
      resolve(_log);
    });

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
                  } else if (currentEventType === 'content_block_delta') {
                    if (ttft === -1) {
                      ttft = Date.now() - start;
                    }
                    if (data.delta?.type === 'text_delta') {
                      outputContent += data.delta.text || '';
                    }
                  } else if (currentEventType === 'message_delta') {
                    usage = data.usage;
                    inputTokens = usage?.input_tokens || inputTokens;
                    outputTokens = usage?.output_tokens || outputTokens;
                    cacheReadInputTokens =
                      usage?.cache_read_input_tokens || cacheReadInputTokens;
                    cacheWriteInputTokens =
                      usage?.cache_creation_input_tokens ||
                      cacheWriteInputTokens;
                    responseCost = usage?.cost;
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
          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;

          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : options.isCustomRoute && (customInputPrice || customOutputPrice)
                ? getLLMCostDecimalWithCustomPrice(
                    inputTokens,
                    outputTokens,
                    customInputPrice,
                    customOutputPrice
                  )
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
              ttft,
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
          const inputTokens = usage?.input_tokens || 0;
          const outputTokens = usage?.output_tokens || 0;
          const cacheReadInputTokens = usage?.cache_read_input_tokens || 0;
          const cacheWriteInputTokens = usage?.cache_creation_input_tokens || 0;
          const responseCost = usage?.cost;

          const contentBlocks = responseBody.content || [];
          const outputContent = contentBlocks
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('');

          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;

          const price =
            responseCost !== undefined
              ? new Prisma.Decimal(responseCost)
              : options.isCustomRoute && (customInputPrice || customOutputPrice)
                ? getLLMCostDecimalWithCustomPrice(
                    inputTokens,
                    outputTokens,
                    customInputPrice,
                    customOutputPrice
                  )
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
