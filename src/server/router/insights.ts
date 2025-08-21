import { Router } from 'express';
import { env } from '../utils/env.js';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import z from 'zod';
import {
  warehouseAISystemPrompt,
  warehouseAITools,
} from '../model/insights/warehouse/ai.js';
import { auth } from '../middleware/authjs.js';
import { INIT_ADMIN_USER_ID } from '../utils/const.js';

export const insightsRouter = Router();

const openai = createOpenAI({
  baseURL: env.openai.baseUrl,
  apiKey: env.openai.apiKey,
});

insightsRouter.post('/:workspaceId/chat', auth(), async (req, res) => {
  if (!env.isDev || !env.openai.enable) {
    // only for dev now, and require shared OpenAI enabled
    res.status(404).end();
    return;
  }

  if (req.user?.id !== INIT_ADMIN_USER_ID) {
    res.status(401).end('This feature is only for admin user');
    return;
  }

  const { messages } = req.body as { messages: Array<Omit<UIMessage, 'id'>> };
  const model = openai(env.openai.modelName);
  const result = streamText({
    model,
    messages: [
      {
        role: 'system',
        content: warehouseAISystemPrompt,
      },
      ...convertToModelMessages(messages),
    ],
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

  result.pipeUIMessageStreamToResponse(res);
});
