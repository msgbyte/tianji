import { describe, expect, test } from 'vitest';
import {
  basicSurveyClassifyPromptToken,
  buildSurveyClassifyPrompt,
  buildSurveyTranslationPrompt,
} from './survey.js';
import {
  calcOpenAIToken,
  ensureJSONOutput,
  getOpenAIClient,
  modelName,
  requestOpenAI,
} from '../openai.js';

describe('buildSurveyClassifyPrompt', () => {
  test('prompt token', () => {
    const { prompt } = buildSurveyClassifyPrompt([], []);

    expect(calcOpenAIToken(prompt)).toBe(basicSurveyClassifyPromptToken);
  });

  test.runIf(Boolean(process.env.TEST_SURVEY_PROMPT))(
    'test prompt effect',
    {
      timeout: 30_000,
    },
    async () => {
      const { prompt, question } = buildSurveyClassifyPrompt(
        [
          { id: 'fooo', content: 'Hello, World!' },
          { id: 'baar', content: 'Hello, Tianji!' },
        ],
        []
      );

      const res = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const json = ensureJSONOutput(res.choices[0].message.content ?? '');
      expect(json).not.toBeNull();
    }
  );
});

describe('buildSurveyTranslationPrompt', () => {
  test.runIf(Boolean(process.env.TEST_SURVEY_PROMPT))(
    'test prompt effect',
    {
      timeout: 60_000,
    },
    async () => {
      const { prompt, question } = buildSurveyTranslationPrompt(
        [
          { id: 'fooo', content: 'Hello, World!' },
          { id: 'baar', content: 'Hello, Tianji!' },
          { id: 'baaz', content: 'Some bad case with "wrap with qutoe"' },
        ],
        'fr-FR'
      );

      const res = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const json = ensureJSONOutput(res.choices[0].message.content ?? '');
      expect(json).not.toBeNull();
    }
  );
});
