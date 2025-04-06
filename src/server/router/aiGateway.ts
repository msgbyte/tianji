import { Router } from 'express';
import { calcOpenAIToken } from '../model/openai.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '../model/_client.js';
import { AIGatewayLogs, AIGatewayLogsStatus } from '@prisma/client';

export const aiGatewayRouter = Router();

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

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/openai/chat/completions',
  async (req, res) => {
    const payload = openaiRequestSchema.parse(req.body);
    const { model, messages, stream } = payload;
    const { workspaceId, gatewayId } = z
      .object({
        workspaceId: z.string(),
        gatewayId: z.string(),
      })
      .parse(req.params);
    const apiKey = (req.headers.authorization ?? '').replace('Bearer ', '');
    const start = Date.now();

    const logP = new Promise<AIGatewayLogs>(async (resolve) => {
      const inputToken = messages.reduce((acc, msg) => {
        return acc + calcOpenAIToken(String(msg.content));
      }, 0);

      const _log = await prisma.aIGatewayLogs.create({
        data: {
          workspaceId,
          gatewayId,
          modelName: model,
          stream,
          inputToken,
          outputToken: -1,
          duration: -1,
          ttft: -1,
          requestPayload: payload,
          responsePayload: {},
          status: AIGatewayLogsStatus.Pending,
        },
      });

      resolve(_log);
    });

    try {
      const openai = new OpenAI({
        apiKey,
      });

      // Handle stream response
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
          ...payload,
          stream: true,
        });

        let outputContent = '';
        let ttft = -1;
        for await (const chunk of stream) {
          if (ttft === -1) {
            ttft = Date.now() - start;
          }
          const content = chunk.choices[0]?.delta?.content || '';
          outputContent += content;
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

        logP.then(async ({ id: logId }) => {
          const duration = Date.now() - start;

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              outputToken: calcOpenAIToken(outputContent),
              duration,
              ttft,
              responsePayload: { content: outputContent },
            },
          });
        });
      } else {
        // Handle normal response
        const response = await openai.chat.completions.create({
          ...payload,
          stream: false,
        });

        res.json(response);

        logP.then(async ({ id: logId }) => {
          const duration = Date.now() - start;

          await prisma.aIGatewayLogs.update({
            where: {
              id: logId,
            },
            data: {
              status: AIGatewayLogsStatus.Success,
              outputToken:
                response.usage?.completion_tokens ??
                (typeof response.choices[0].message.content === 'string'
                  ? calcOpenAIToken(response.choices[0].message.content)
                  : 0),
              duration,
              responsePayload: { ...response },
            },
          });
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
  }
);
