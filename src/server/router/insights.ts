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
  createWarehouseAITools,
} from '../model/insights/warehouse/ai.js';
import { auth } from '../middleware/authjs.js';
import { INIT_ADMIN_USER_ID } from '../utils/const.js';
import { get, last } from 'lodash-es';
import { getWarehouseScopes } from '../model/insights/warehouse/utils.js';
import { prisma } from '../model/_client.js';

interface WarehouseChatMetadata {
  scopes: Array<{
    type: 'database' | 'table';
    id: string;
    name: string;
    databaseId?: string; // For table type
  }>;
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
  let databaseConnectionUrl: string | undefined;

  // Extract database connection URL from scopes
  if (Array.isArray(scopes) && scopes.length > 0) {
    // Extract unique database IDs from scopes
    const databaseIds = new Set<string>();

    for (const scope of scopes) {
      if (scope.type === 'database') {
        databaseIds.add(scope.id);
      } else if (scope.type === 'table' && scope.databaseId) {
        databaseIds.add(scope.databaseId);
      }
    }

    // Ensure we only have one database
    if (databaseIds.size !== 1) {
      res.status(400).end('Cannot query across multiple databases');
      return;
    }

    // Get the database connection URL
    const databaseId = Array.from(databaseIds)[0];
    const database = await prisma.warehouseDatabase.findUnique({
      where: { id: databaseId },
      select: { connectionUri: true },
    });

    if (!database || !database.connectionUri) {
      res.status(400).end('Database connection not found');
      return;
    }

    databaseConnectionUrl = database.connectionUri;
  }

  // Create AI tools with the specific database connection URL
  const aiTools = databaseConnectionUrl
    ? createWarehouseAITools(databaseConnectionUrl)
    : warehouseAITools;

  // Prepare input messages
  if (Array.isArray(scopes) && scopes.length > 0) {
    // Get table metadata
    const tables = await getWarehouseScopes(workspaceId, scopes);

    inputMessages.push(
      {
        role: 'system',
        content: warehouseAISystemPrompt({
          needGetContext: false,
          tools: aiTools,
        }),
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
      content: warehouseAISystemPrompt({
        needGetContext: true,
        tools: aiTools,
      }),
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
      ...aiTools,
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
