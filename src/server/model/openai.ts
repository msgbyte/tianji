import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { encoding_for_model, Tiktoken, type TiktokenModel } from 'tiktoken';
import {
  checkCredit,
  costCredit,
  tokenCreditFactor,
} from './billing/credit.js';
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
  // @ts-ignore
} from 'openai/resources/chat/completions.mjs';
import { createAuditLog } from './auditLog.js';

export const modelName = env.openai.modelName ?? 'gpt-4o';

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
      baseURL: env.openai.baseUrl,
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

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: question,
    },
  ];

  const res = await getOpenAIClient().chat.completions.create({
    ...options,
    model: modelName,
    messages: messages,
  });

  const content = res.choices[0].message.content;
  const usage = res.usage;

  const credit = tokenCreditFactor * (usage?.total_tokens ?? 0);

  if (env.debugAIFeature) {
    console.log('[DEBUG AI] Start =======================');
    console.log('[DEBUG AI] Prompt:');
    for (const m of messages) {
      console.log(m.role);
      console.log(m.content);
    }
    console.log('[DEBUG AI] Prompt END');

    console.log('[DEBUG AI] Output:');
    console.log(content);
    console.log('[DEBUG AI] Output END');

    console.log('[DEBUG AI] Usage:');
    console.log(usage);

    console.log('[DEBUG AI] End =======================');
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

export function calcOpenAIToken(message: string, model = modelName): number {
  let encoder: Tiktoken;
  try {
    encoder = encoding_for_model(model as TiktokenModel);
  } catch {
    encoder = encoding_for_model('gpt-4o');
  }
  const count = encoder.encode(message).length;

  encoder.free();

  return count;
}

export function groupByTokenSize<T>(
  arr: T[],
  selector: (item: T) => string,
  maxToken: number
): T[][] {
  const groups: T[][] = [[]];

  let currentToken = 0;
  for (const item of arr) {
    const token = calcOpenAIToken(selector(item));

    if (currentToken + token > maxToken) {
      groups.push([]);
      currentToken = 0;
    }

    currentToken += token;

    groups[groups.length - 1].push(item);
  }

  return groups;
}
