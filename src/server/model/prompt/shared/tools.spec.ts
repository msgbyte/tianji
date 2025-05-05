import { beforeAll, describe, expect, test } from 'vitest';
import { env } from '../../../utils/env.js';
import { getOpenAIClient } from '../../openai.js';
import { openAITools } from './tools.js';
import dayjs from 'dayjs';

describe.runIf(env.openai.apiKey)('openai tools', () => {
  let openaiClient: ReturnType<typeof getOpenAIClient>;

  beforeAll(() => {
    openaiClient = getOpenAIClient();
  });

  describe.skip('getSurveyByDateRange', () => {
    const currentDate = dayjs();
    const systemPrompt = `You are a helper who helps the user to perform functions. Current date is ${currentDate.toISOString()}.`;

    test('fetch recent 7 days survey', async () => {
      const chatCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please help me analyze the data recent 7 days.`,
          },
        ],
        tools: [
          { type: 'function', function: openAITools.getSurveyByDateRange },
        ],
        tool_choice: 'required',
      });

      const functionCall = chatCompletion.choices[0].message.tool_calls;

      expect(functionCall).not.toBeUndefined();
      expect(functionCall?.length).toBe(1);
      expect(functionCall?.[0].function.name).toBe('getSurveyByDateRange');
      expect(JSON.parse(functionCall?.[0].function.arguments!)).toEqual({
        startAt: currentDate.subtract(7, 'days').toISOString(),
        endAt: currentDate.toISOString(),
      });
    });

    test('fetch precise date range survey', async () => {
      const chatCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please help me analyze the data from 2025-01-01 to 2025-01-10.`,
          },
        ],
        tools: [
          { type: 'function', function: openAITools.getSurveyByDateRange },
        ],
        tool_choice: 'required',
      });

      const functionCall = chatCompletion.choices[0].message.tool_calls;

      expect(functionCall).not.toBeUndefined();
      expect(functionCall?.length).toBe(1);
      expect(functionCall?.[0].function.name).toBe('getSurveyByDateRange');
      expect(JSON.parse(functionCall?.[0].function.arguments!)).toEqual({
        startAt: '2025-01-01T00:00:00Z',
        endAt: '2025-01-10T00:00:00Z',
      });
    });

    test('ambiguous instructions', async () => {
      const chatCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please help me analyze the data.`,
          },
        ],
        tools: [
          { type: 'function', function: openAITools.getSurveyByDateRange },
        ],
        tool_choice: 'required',
      });

      const functionCall = chatCompletion.choices[0].message.tool_calls;

      expect(functionCall).not.toBeUndefined();
      expect(functionCall?.length).toBe(1);
      expect(functionCall?.[0].function.name).toBe('getSurveyByDateRange');
      expect(JSON.parse(functionCall?.[0].function.arguments!)).toEqual({
        startAt: expect.any(String),
        endAt: expect.any(String),
      });
    });
  });
});
