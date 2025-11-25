import { Router } from 'express';
import { env } from '../utils/env.js';
import { createOpenAI } from '@ai-sdk/openai';
import { ModelMessage, UIMessage } from 'ai';
import {
  warehouseAISystemPrompt,
  createWarehouseAITools,
  createWarehouseAIStream,
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
  if (!env.openai.enable) {
    // only for dev now, and require shared OpenAI enabled
    res
      .status(401)
      .end(
        'This feature is not enabled, both need enabled openai and warehouse to use this feature'
      );
    return;
  }

  if (req.user?.id !== INIT_ADMIN_USER_ID && !env.isDev) {
    // NOTICE: this feature is not integrated with billing system yet.
    res.status(401).end('This feature is only for admin user');
    return;
  }

  const {
    messages,
    toolType = 'chart',
    systemPrompt,
  } = req.body as {
    messages: Array<Omit<UIMessage, 'id'>>;
    toolType: 'chart' | 'sql';
    systemPrompt?: string;
  };
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
  const aiTools = createWarehouseAITools(toolType, databaseConnectionUrl);
  const hasScope = Array.isArray(scopes) && scopes.length > 0;

  // Prepare input messages
  inputMessages.push({
    role: 'system',
    content: warehouseAISystemPrompt({
      needGetContext: !hasScope, // if has scope, we don't need to get context anymore
      tools: aiTools,
    }),
  });

  if (systemPrompt) {
    inputMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  if (hasScope) {
    // Get table metadata
    const tables = await getWarehouseScopes(workspaceId, scopes);

    inputMessages.push({
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
    });
  }

  const result = createWarehouseAIStream({
    model,
    inputMessages,
    messages,
    aiTools,
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
