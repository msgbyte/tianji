import { buildQueryWithCache } from '../cache/index.js';
import { prisma } from './_client.js';
import { type RequestHandler, type Request } from 'express';
import { calcMessagesToken, calcOpenAIToken } from '../model/openai.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { AIGatewayLogs, AIGatewayLogsStatus } from '@prisma/client';
import {
  getLLMCostDecimalV2,
  getLLMCostDecimalWithCustomPrice,
  getOpenRouterCostDecimal,
} from '../utils/llm.js';
import { get } from 'lodash-es';
import { verifyUserApiKey } from '../model/user.js';
import { checkQuotaAlert } from './aiGateway/quotaAlert.js';
import { logger } from '../utils/logger.js';

export const { get: getGatewayInfoCache, del: clearGatewayInfoCache } =
  buildQueryWithCache(async (workspaceId: string, gatewayId: string) => {
    const gatewayInfo = await prisma.aIGateway.findUnique({
      where: {
        workspaceId,
        id: gatewayId,
      },
    });

    return gatewayInfo;
  });

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

    const logP = new Promise<AIGatewayLogs>(async (resolve) => {
      const _log = await prisma.aIGatewayLogs.create({
        data: {
          workspaceId,
          gatewayId,
          modelName,
          stream,
          inputToken: -1,
          outputToken: -1,
          duration: -1,
          ttft: -1,
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
      const modelProvider = options.modelProvider ?? 'openai';
      const modelPriceName = options.modelPriceName
        ? options.modelPriceName(modelName)
        : modelName;

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

          // Use custom price if available, otherwise use default pricing
          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;

          const price =
            modelProvider === 'openrouter' && Boolean(openrouterProviderName)
              ? await getOpenRouterCostDecimal(
                  modelPriceName,
                  openrouterProviderName,
                  inputToken,
                  outputToken
                )
              : options.isCustomRoute && (customInputPrice || customOutputPrice)
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
                    outputToken
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

          // Use custom price if available, otherwise use default pricing
          const customInputPrice = gatewayInfo?.customModelInputPrice;
          const customOutputPrice = gatewayInfo?.customModelOutputPrice;
          const price =
            modelProvider === 'openrouter' && Boolean(openrouterProviderName)
              ? await getOpenRouterCostDecimal(
                  modelPriceName,
                  openrouterProviderName,
                  inputToken,
                  outputToken
                )
              : options.isCustomRoute && (customInputPrice || customOutputPrice)
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
                    outputToken
                  );

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              inputToken,
              outputToken,
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
