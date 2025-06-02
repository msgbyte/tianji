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
    try {
      // Strategy 1: Try parsing as-is first
      JSON.parse(str);
      return str; // If it parses successfully, return as-is
    } catch (error) {
      // Strategy 2: Fix control characters first (most common issue)
      let result = str;

      // Fix actual control characters in JSON strings (not escaped sequences)
      // Be careful to only replace actual control characters that break JSON parsing
      result = result.replace(/\n/g, '\\n'); // Fix actual newlines
      result = result.replace(/\r/g, '\\r'); // Fix actual carriage returns
      result = result.replace(/\t/g, '\\t'); // Fix actual tabs
      // Note: Don't fix \b and \f as they might appear in normal text content

      // Try parsing after control character fix
      try {
        JSON.parse(result);
        return result;
      } catch (error2) {
        // Strategy 3: More sophisticated quote fixing for complex cases
        // This handles nested quotes within JSON string values
        let fixed = result;

        try {
          // Use a state machine approach to fix quotes properly
          fixed = fixQuotesWithStateMachine(result);
          JSON.parse(fixed);
          return fixed;
        } catch (error3) {
          // Strategy 4: For extremely complex JSON, try a simplified approach
          // If the JSON is too complex with many nested quotes, we'll be more conservative
          if (str.length > 5000) {
            logger.warn('[fixJSONQuotes] JSON too complex to reliably fix', {
              length: str.length,
              error: (error3 as Error).message,
            });
            return str; // Return original for manual handling
          }

          // Strategy 5: Simple quote fixes for shorter content
          const fixes = [
            // Fix 1: Handle patterns like "key":"value with "quotes"" - more specific pattern
            (s: string) =>
              s.replace(
                /"([^"]+)":\s*"([^"]*)"([^",}]*)"([^",}]*)/g,
                (match, key, start, middle, end) => {
                  // Only fix if middle part doesn't contain common JSON delimiters
                  if (
                    !middle.includes(':') &&
                    !middle.includes(',') &&
                    !middle.includes('{') &&
                    !middle.includes('}')
                  ) {
                    return `"${key}":"${start}\\"${middle}\\"${end}`;
                  }
                  return match;
                }
              ),

            // Fix 2: Handle mid-string quotes that are clearly inside values
            (s: string) =>
              s.replace(
                /:\s*"([^"]*)"([^",}]+)"([^",}]*)/g,
                (match, start, middle, end) => {
                  // Only fix if middle part looks like text content, not JSON structure
                  if (
                    !middle.includes(':') &&
                    !middle.includes(',') &&
                    middle.length < 50
                  ) {
                    return `:"${start}\\"${middle}\\"${end}`;
                  }
                  return match;
                }
              ),

            // Fix 3: Handle quotes in parentheses which are likely content
            (s: string) => s.replace(/\("([^"]+)"\)/g, '(\\"$1\\")'),
          ];

          for (const fix of fixes) {
            try {
              const attemptResult = fix(fixed);
              JSON.parse(attemptResult);
              return attemptResult; // Success!
            } catch (e) {
              // Continue with original result for next fix
              continue;
            }
          }

          // Strategy 6: Final fallback
          logger.error('[fixJSONQuotes] All strategies failed', {
            original: str.substring(0, 200) + '...',
            error: (error3 as Error).message,
          });
          return str;
        }
      }
    }
  };

  // More sophisticated state machine approach for fixing quotes
  function fixQuotesWithStateMachine(jsonStr: string): string {
    let result = '';
    let inString = false;
    let depth = 0;
    let escapeNext = false;

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      const nextChar = i < jsonStr.length - 1 ? jsonStr[i + 1] : '';

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }

      if (char === '{' || char === '[') {
        if (!inString) depth++;
        result += char;
        continue;
      }

      if (char === '}' || char === ']') {
        if (!inString) depth--;
        result += char;
        continue;
      }

      if (char === '"') {
        if (!inString) {
          // Starting a string
          inString = true;
          result += char;
        } else {
          // We're in a string, check if this quote should end the string
          // Look ahead to see what comes next
          let j = i + 1;
          while (j < jsonStr.length && /\s/.test(jsonStr[j])) j++; // Skip whitespace

          const nextNonWhiteChar = j < jsonStr.length ? jsonStr[j] : '';

          // If followed by : or , or } or ], this is likely the end quote
          if (
            nextNonWhiteChar === ':' ||
            nextNonWhiteChar === ',' ||
            nextNonWhiteChar === '}' ||
            nextNonWhiteChar === ']' ||
            j >= jsonStr.length
          ) {
            // This should end the string
            inString = false;
            result += char;
          } else {
            // This quote is inside the string value, escape it
            result += '\\"';
          }
        }
        continue;
      }

      result += char;
    }

    return result;
  }

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
