import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { encoding_for_model } from 'tiktoken';
import {
  checkCredit,
  costCredit,
  tokenCreditFactor,
} from './billing/credit.js';
// @ts-ignore
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions.mjs';
import { createAuditLog } from './auditLog.js';
import { logger } from '../utils/logger.js';

export const modelName = 'gpt-4o-mini';

let openaiClient: OpenAI;

export function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  } else {
    if (!env.openai.apiKey) {
      throw new Error('AI feature not enabled');
    }

    openaiClient = new OpenAI({
      apiKey: env.openai.apiKey,
    });

    return openaiClient;
  }
}

export async function requestOpenAI(
  workspaceId: string,
  prompt: string,
  question: string,
  options: Omit<
    ChatCompletionCreateParamsBase,
    'model' | 'messages' | 'stream'
  > = {},
  context?: Record<string, string>
): Promise<string> {
  if (!env.openai.enable) {
    return '';
  }

  await checkCredit(workspaceId);

  const messages = [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: question,
    },
  ] satisfies ChatCompletionMessageParam[];

  const res = await getOpenAIClient().chat.completions.create({
    ...options,
    model: modelName,
    messages: messages,
  });

  const content = res.choices[0].message.content;
  const usage = res.usage;

  const credit = tokenCreditFactor * (usage?.total_tokens ?? 0);

  if (env.debugAIFeature) {
    logger.info('[DEBUG AI]', {
      input: messages,
      output: content,
      usage,
    });
  }

  await costCredit(workspaceId, credit, 'ai', {
    ...usage,
    ...context,
  });
  createAuditLog({
    workspaceId,
    content: JSON.stringify({
      type: 'ai',
      usage,
      context,
      credit,
    }),
  });

  return content ?? '';
}

export function calcOpenAIToken(message: string) {
  const encoder = encoding_for_model(modelName);
  const count = encoder.encode(message).length;

  encoder.free();

  return count;
}
