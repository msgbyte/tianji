import { beforeAll, describe, expect, test } from 'vitest';
import { env } from '../utils/env.js';
import {
  getOpenAIClient,
  groupByTokenSize,
  ensureJSONOutput,
} from './openai.js';
import OpenAI from 'openai';

const functions = {
  getCurrentDate: {
    name: 'getCurrentDate',
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: "Date format, such as 'YYYY-MM-DD' or 'ISO'",
        },
      },
      required: ['format'],
    },
  },
};

async function executeFunction(name: string, args: any) {
  if (name === 'getCurrentDate') {
    const { format } = args;
    const now = new Date();
    if (format === 'YYYY-MM-DD') {
      return { date: now.toISOString().split('T')[0] };
    } else if (format === 'ISO') {
      return { date: now.toISOString() };
    } else {
      throw new Error('Unsupported format');
    }
  }
  throw new Error('Function not implemented');
}

describe.runIf(env.openai.apiKey)('openai', () => {
  let openaiClient: OpenAI;

  beforeAll(() => {
    openaiClient = getOpenAIClient();
  });

  test('test openai tool choose', async () => {
    try {
      const chatCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          // { role: 'system', content: 'You are a helper who helps the user to perform functions.' },
          {
            role: 'user',
            content: `Tell me today's date in the format YYYY-MM-DD.`,
          },
        ],
        tools: [{ type: 'function', function: functions.getCurrentDate }],
        tool_choice: 'auto',
      });

      const functionCall = chatCompletion.choices[0].message.tool_calls;

      if (functionCall && functionCall.length > 0) {
        const { name, arguments: args } = functionCall[0].function;
        console.log('functionCall', functionCall);
        const parsedArgs = JSON.parse(args);
        const result = await executeFunction(name, parsedArgs);

        console.log('Function call result:', result);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

describe('groupByTokenSize', () => {
  test('simple', () => {
    expect(
      groupByTokenSize(
        [
          { content: 'foooooo' },
          { content: 'foooooo' },
          { content: 'foooooo' },
        ],
        (item) => item.content,
        8
      )
    ).toEqual([
      [{ content: 'foooooo' }, { content: 'foooooo' }],
      [{ content: 'foooooo' }],
    ]);
  });
});

describe('ensureJSONOutput', () => {
  test('should parse direct JSON string', () => {
    const input = '{"name": "test", "value": 123}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', value: 123 });
  });

  test('should parse direct JSON array', () => {
    const input = '[{"id": 1}, {"id": 2}]';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('should handle JSON with whitespace', () => {
    const input = '  \n  {"name": "test"}  \n  ';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in ```json``` blocks', () => {
    const input = '```json\n{"name": "test", "active": true}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', active: true });
  });

  test('should parse JSON wrapped in ```json``` blocks with extra whitespace', () => {
    const input = '```json   \n\n  {"name": "test"}  \n\n  ```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in ```json``` blocks case insensitive', () => {
    const input = '```JSON\n{"name": "test"}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test' });
  });

  test('should parse JSON wrapped in generic ``` blocks', () => {
    const input = '```\n{"name": "test", "count": 42}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ name: 'test', count: 42 });
  });

  test('should parse JSON array wrapped in generic ``` blocks', () => {
    const input = '```\n[1, 2, 3]\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([1, 2, 3]);
  });

  test('should ignore non-JSON content in generic ``` blocks', () => {
    const input = '```\nThis is not JSON\nJust some text\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should find JSON in mixed text content', () => {
    const input =
      'Here is the result: {"status": "success", "data": [1, 2, 3]} and that\'s it.';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ status: 'success', data: [1, 2, 3] });
  });

  test('should find JSON array in mixed text content', () => {
    const input = 'The numbers are: [10, 20, 30] as requested.';
    const result = ensureJSONOutput(input);
    expect(result).toEqual([10, 20, 30]);
  });

  test('should handle complex nested JSON', () => {
    const input =
      '```json\n{"user": {"name": "John", "settings": {"theme": "dark", "notifications": true}}, "items": [{"id": 1, "name": "Item 1"}]}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({
      user: {
        name: 'John',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [{ id: 1, name: 'Item 1' }],
    });
  });

  test('should return null for invalid JSON', () => {
    const input = '{"name": "test", invalid}';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for non-JSON text', () => {
    const input = 'This is just plain text without any JSON content.';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for empty string', () => {
    const input = '';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should return null for only whitespace', () => {
    const input = '   \n\t   ';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should handle malformed JSON in code blocks', () => {
    const input = '```json\n{"name": "test", "value":}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should prioritize direct JSON over embedded JSON', () => {
    const input = '{"direct": true}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ direct: true });
  });

  test('should handle JSON with special characters', () => {
    const input =
      '{"message": "Hello\\nWorld!", "emoji": "🌟", "unicode": "测试"}';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({
      message: 'Hello\nWorld!',
      emoji: '🌟',
      unicode: '测试',
    });
  });

  test('should handle multiple JSON blocks and return the first valid one', () => {
    const input =
      'First: ```json\n{"first": true}\n``` Second: ```json\n{"second": true}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toEqual({ first: true });
  });

  test('should handle JSON with comments (which should fail)', () => {
    const input =
      '```json\n{\n  // This is a comment\n  "name": "test"\n}\n```';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });

  test('should handle JSON with trailing commas (which should fail)', () => {
    const input = '{"name": "test", "value": 123,}';
    const result = ensureJSONOutput(input);
    expect(result).toBeNull();
  });
});
