import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { encoding_for_model } from 'tiktoken';

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

export function calcOpenAIToken(message: string) {
  const encoder = encoding_for_model(modelName);
  const count = encoder.encode(message).length;

  encoder.free();

  return count;
}
