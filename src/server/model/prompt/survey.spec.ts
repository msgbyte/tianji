import { describe, expect, test } from 'vitest';
import {
  basicSurveyClassifyPromptToken,
  buildSurveyClassifyPrompt,
} from './survey.js';
import { calcOpenAIToken } from '../openai.js';

describe('buildSurveyClassifyPrompt', () => {
  test('prompt token', () => {
    const prompt = buildSurveyClassifyPrompt([], []);

    expect(calcOpenAIToken(prompt)).toBe(basicSurveyClassifyPromptToken);
  });
});
