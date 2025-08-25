import { Router } from 'express';
import { env } from '../utils/env.js';
import { createOpenAI } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  ModelMessage,
  stepCountIs,
  streamText,
  UIMessage,
} from 'ai';
import z from 'zod';
import {
  warehouseAISystemPrompt,
  warehouseAITools,
} from '../model/insights/warehouse/ai.js';
import { auth } from '../middleware/authjs.js';
import { INIT_ADMIN_USER_ID } from '../utils/const.js';
import { get, last } from 'lodash-es';
import { getWarehouseScopes } from '../model/insights/warehouse/utils.js';

interface WarehouseChatMetadata {
  scopes: Array<{ type: 'database' | 'table'; id: string; name: string }>;
}

export const insightsRouter = Router();

const openai = createOpenAI({
  baseURL: env.openai.baseUrl,
  apiKey: env.openai.apiKey,
});

insightsRouter.post('/:workspaceId/chat', auth(), async (req, res) => {
  if (!env.isDev || !env.openai.enable) {
    // only for dev now, and require shared OpenAI enabled
    res.status(404).end('This feature is only for dev or not enabled');
    return;
  }

  if (req.user?.id !== INIT_ADMIN_USER_ID) {
    res.status(401).end('This feature is only for admin user');
    return;
  }

  const { messages } = req.body as { messages: Array<Omit<UIMessage, 'id'>> };
  const workspaceId = req.params.workspaceId;
  const model = openai(env.openai.modelName);
  const metadata = last(messages)?.metadata as WarehouseChatMetadata;
  const scopes = get(metadata, 'scopes', []);

  const inputMessages: ModelMessage[] = [];

  if (Array.isArray(scopes) && scopes.length > 0) {
    const tables = await getWarehouseScopes(workspaceId, scopes);

    inputMessages.push(
      {
        role: 'system',
        content: warehouseAISystemPrompt({ needGetContext: false }),
      },
      {
        role: 'assistant',
        content: `Current Database tables structure is:\n${tables
          .map((t) =>
            JSON.stringify({
              name: t.name,
              prompt: t.prompt,
              ddl: t.ddl,
            })
          )
          .join('\n')}`,
      }
    );
  } else {
    inputMessages.push({
      role: 'system',
      content: warehouseAISystemPrompt({ needGetContext: true }),
    });
  }

  const result = streamText({
    model,
    messages: [...inputMessages, ...convertToModelMessages(messages)],
    stopWhen: stepCountIs(5),
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        inputSchema: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        inputSchema: z.object({}),
      },
      ...warehouseAITools,
    },
  });

  result.pipeUIMessageStreamToResponse(res, {
    sendReasoning: true,
    async onFinish() {
      try {
        const usage = await result.totalUsage;
        res.write(
          `data: ${JSON.stringify({ type: 'data-usage', data: usage })}\n\n`
        );
        if (res.flush) {
          res.flush();
        }
      } catch {}
    },
  });
});
