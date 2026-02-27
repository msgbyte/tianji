// fetch llm model data from `https://models.dev/api.json`
// and output to `src/server/utils/model_prices_and_context_window_v2.json`

import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_URL = 'https://models.dev/api.json';
const TARGET_PATH = path.resolve(
  __dirname,
  '../src/server/utils/model_prices_and_context_window_v2.json'
);

const modelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    cost: z
      .object({
        input: z.number().optional(),
        output: z.number().optional(),
      })
      .passthrough()
      .optional(),
    limit: z
      .object({
        context: z.number().optional(),
        output: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const providerSchema = z
  .object({
    name: z.string(),
    models: z.record(z.string(), modelSchema),
  })
  .passthrough();

const llmModelDataSchema = z.record(z.string(), providerSchema);

export type LLMModelData = z.infer<typeof llmModelDataSchema>;
export type LLMProvider = z.infer<typeof providerSchema>;
export type LLMModel = z.infer<typeof modelSchema>;

async function fetchLLMModelDataV2() {
  try {
    console.log(`Fetching LLM model data from: ${SOURCE_URL}`);

    const response = await fetch(SOURCE_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`
      );
    }

    const raw = await response.json();
    llmModelDataSchema.parse(raw);

    const targetDir = path.dirname(TARGET_PATH);
    await fs.ensureDir(targetDir);

    await fs.writeJSON(TARGET_PATH, raw, { spaces: 2 });

    console.log(`LLM model data v2 has been written to: ${TARGET_PATH}`);
    console.log(`Total providers: ${Object.keys(raw).length}`);

    let totalModels = 0;
    Object.values(raw).forEach((provider: any) => {
      if (provider.models) {
        totalModels += Object.keys(provider.models).length;
      }
    });
    console.log(`Total models: ${totalModels}`);
  } catch (err) {
    console.error('Error fetching or writing LLM model data v2:', err);
    process.exit(1);
  }
}

fetchLLMModelDataV2();
