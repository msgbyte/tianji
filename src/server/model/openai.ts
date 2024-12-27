import OpenAI from 'openai';
import { env } from '../utils/env.js';

export const openaiClient = new OpenAI({
  apiKey: env.openai.apiKey,
});
