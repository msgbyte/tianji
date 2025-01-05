import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { encoding_for_model } from 'tiktoken';

export const modelName = 'gpt-4o-mini';

export const openaiClient = new OpenAI({
  apiKey: env.openai.apiKey,
});

export function calcOpenAIToken(message: string) {
  const encoder = encoding_for_model(modelName);
  const count = encoder.encode(message).length;

  encoder.free();

  return count;
}
