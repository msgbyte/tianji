import { Router } from 'express';
import { env } from '../utils/env.js';
import { createOpenAI } from '@ai-sdk/openai';
import { ModelMessage, UIMessage } from 'ai';
import {
  htmlEditorAISystemPrompt,
  createHtmlEditorAITools,
  createHtmlEditorAIStream,
} from '../model/page/ai.js';
import { auth } from '../middleware/authjs.js';
import { INIT_ADMIN_USER_ID } from '../utils/const.js';
import { last } from 'lodash-es';

interface HtmlEditorChatMetadata {
  currentHtmlCode?: string;
  selectedElement?: {
    tagName: string;
    className: string;
    id: string;
    lineStart: string;
    lineEnd: string;
    textContent: string;
    outerHTML: string;
  };
}

export const pageRouter = Router();

const openai = createOpenAI({
  baseURL: env.openai.baseUrl,
  apiKey: env.openai.apiKey,
});

pageRouter.post('/:workspaceId/chat', auth(), async (req, res) => {
  if (!env.openai.enable) {
    res
      .status(401)
      .end('This feature is not enabled, OpenAI integration is required');
    return;
  }

  if (req.user?.id !== INIT_ADMIN_USER_ID && !env.isDev) {
    // NOTICE: this feature is not integrated with billing system yet.
    res.status(401).end('This feature is only for admin user');
    return;
  }

  const { messages, systemPrompt } = req.body as {
    messages: Array<Omit<UIMessage, 'id'>>;
    systemPrompt?: string;
  };

  const workspaceId = req.params.workspaceId;
  const model = openai(env.openai.modelName);
  const metadata = last(messages)?.metadata as
    | HtmlEditorChatMetadata
    | undefined;

  const inputMessages: ModelMessage[] = [];

  // Add system prompt
  inputMessages.push({
    role: 'system',
    content: htmlEditorAISystemPrompt(),
  });

  // Add custom system prompt if provided
  if (systemPrompt) {
    inputMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Include current HTML code as context if available
  if (metadata?.currentHtmlCode) {
    inputMessages.push({
      role: 'assistant',
      content: `Current HTML code:\n\`\`\`html\n${metadata.currentHtmlCode}\n\`\`\``,
    });
  }

  // Include selected element context if available
  if (metadata?.selectedElement && metadata?.currentHtmlCode) {
    const el = metadata.selectedElement;
    const lineStart = parseInt(el.lineStart, 10);
    const lineEnd = parseInt(el.lineEnd, 10);

    // Extract the full HTML of the selected element from the code
    let selectedHtml = '';
    if (lineStart && lineEnd && !isNaN(lineStart) && !isNaN(lineEnd)) {
      const lines = metadata.currentHtmlCode.split('\n');
      selectedHtml = lines.slice(lineStart - 1, lineEnd).join('\n');
    }

    const elementDescription = [
      `Selected element: <${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}${el.className ? ` class="${el.className}"` : ''}>`,
      `Location: Lines ${el.lineStart}-${el.lineEnd}`,
      selectedHtml
        ? `\nComplete HTML of selected element:\n\`\`\`html\n${selectedHtml}\n\`\`\``
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    inputMessages.push({
      role: 'assistant',
      content: `User has selected an element:\n${elementDescription}\n\nWhen modifying code, focus on this element or the area around it if the user's request relates to it.`,
    });
  }

  const aiTools = createHtmlEditorAITools();

  const result = createHtmlEditorAIStream({
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
