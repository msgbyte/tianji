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
import { logger } from '../utils/logger.js';

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

export type RequestOpenAIOptions = Omit<
  ChatCompletionCreateParamsBase,
  'model' | 'messages' | 'stream'
>;

export async function requestOpenAI(
  workspaceId: string,
  prompt: string,
  question: string,
  options: RequestOpenAIOptions = {},
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

export function ensureJSONOutput(content: string): Record<string, any> | null {
  // Remove leading/trailing whitespace
  const trimmedContent = content.trim();

  // Helper function to attempt JSON parsing with error handling
  const tryParseJSON = (jsonStr: string): Record<string, any> | null => {
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      return null;
    }
  };

  // Helper function to fix common JSON issues
  const fixJSONQuotes = (str: string): string => {
    const res = fixJsonQuotes(str);
    try {
      JSON.parse(res);
      return res;
    } catch (error) {
      return res.replace(/\n/g, ''); // TODO: This is a last resort, as we've found many bad cases where the presence of \n causes parsing to fail, so we need to remove \n here
    }
  };

  // First, try to parse the content directly as JSON
  const directResult = tryParseJSON(trimmedContent);
  if (directResult) {
    return directResult;
  }

  // Try to find JSON wrapped in ```json ``` blocks
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?\s*```/i;
  const jsonBlockMatch = trimmedContent.match(jsonBlockRegex);

  if (jsonBlockMatch && jsonBlockMatch[1]) {
    const jsonContent = jsonBlockMatch[1].trim();
    const fixedJsonContent = fixJSONQuotes(jsonContent);
    const result = tryParseJSON(fixedJsonContent);
    if (result) {
      return result;
    } else {
      logger.error('[ensureJSONOutput-2]: Failed to parse JSON block', {
        original: jsonContent,
        fixed: fixedJsonContent,
      });
    }
  }

  // Try to find JSON wrapped in generic ``` blocks (without language specification)
  const codeBlockRegex = /```\s*\n?([\s\S]*?)\n?\s*```/;
  const codeBlockMatch = trimmedContent.match(codeBlockRegex);

  if (codeBlockMatch && codeBlockMatch[1]) {
    const codeContent = codeBlockMatch[1].trim();
    // Check if the content inside code block looks like JSON (starts with { or [)
    if (codeContent.startsWith('{') || codeContent.startsWith('[')) {
      const fixedCodeContent = fixJSONQuotes(codeContent);
      const result = tryParseJSON(fixedCodeContent);
      if (result) {
        return result;
      } else {
        logger.error('[ensureJSONOutput-3]: Failed to parse code block JSON', {
          original: codeContent,
          fixed: fixedCodeContent,
        });
      }
    }
  }

  // Try to find JSON-like content in the text (starting with { or [ and ending with } or ])
  const jsonLikeRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
  const jsonLikeMatch = trimmedContent.match(jsonLikeRegex);

  if (jsonLikeMatch && jsonLikeMatch[1]) {
    const jsonLikeContent = jsonLikeMatch[1];
    const fixedJsonLikeContent = fixJSONQuotes(jsonLikeContent);
    const result = tryParseJSON(fixedJsonLikeContent);
    if (result) {
      return result;
    } else {
      logger.error('[ensureJSONOutput-4]: Failed to parse JSON-like content', {
        original: jsonLikeContent,
        fixed: fixedJsonLikeContent,
      });
    }
  }

  // If all parsing attempts fail, return null
  logger.error(
    '[ensureJSONOutput]: All parsing attempts failed for content:',
    trimmedContent.substring(0, 200) + '...'
  );
  return null;
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

export function fixJsonQuotes(input: string) {
  let output = '';
  let inString = false;
  let inValue = false;
  let escapeNext = false;
  let colonJustSeen = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escapeNext) {
      output += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      output += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      if (!inString) {
        inString = true;

        if (colonJustSeen) {
          inValue = true; // We're entering a value string
        }

        output += char;
        colonJustSeen = false;
      } else {
        // Lookahead to guess if this is the end of a key or value
        const lookahead = input.slice(i + 1).match(/^\s*[:,}]/);
        if (lookahead) {
          // It's the end of a key or value
          output += char;
          inString = false;
          inValue = false;
        } else if (inValue) {
          // We're *inside* a value and hit a double quote -> escape it
          output += '\\"';
        } else {
          output += char;
          inString = false;
        }
      }
    } else {
      output += char;

      if (char === ':') {
        colonJustSeen = true;
      }
    }
  }

  return output;
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
