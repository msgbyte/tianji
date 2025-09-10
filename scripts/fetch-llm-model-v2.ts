// fetch llm model data from `https://models.dev/api.json`
// and output to `src/server/utils/model_prices_and_context_window_v2.json`

import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_URL = 'https://models.dev/api.json';
const TARGET_PATH = path.resolve(
  __dirname,
  '../src/server/utils/model_prices_and_context_window_v2.json'
);

async function fetchLLMModelDataV2() {
  try {
    console.log(`Fetching LLM model data from: ${SOURCE_URL}`);

    const response = await fetch(SOURCE_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Ensure target directory exists
    const targetDir = path.dirname(TARGET_PATH);
    await fs.ensureDir(targetDir);

    // Write data to file
    await fs.writeJSON(TARGET_PATH, data, { spaces: 2 });

    console.log(`LLM model data v2 has been written to: ${TARGET_PATH}`);
    console.log(`Total providers: ${Object.keys(data).length}`);

    // Log some statistics about the data
    let totalModels = 0;
    Object.values(data).forEach((provider: any) => {
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
