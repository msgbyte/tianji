import { describe, test } from 'vitest';
import { env } from '../utils/env.js';
import { getOpenAIClient } from './openai.js';

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
  const openaiClient = getOpenAIClient();

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
