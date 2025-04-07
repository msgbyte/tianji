// fetch llm model price and window context from `https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json`
// and output to `src/server/utils/model_prices_and_context_window.json`

import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json';
const TARGET_PATH = path.resolve(
  __dirname,
  '../src/server/utils/model_prices_and_context_window.json'
);

async function fetchLLMModelData() {
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

    console.log(`LLM model data has been written to: ${TARGET_PATH}`);
  } catch (err) {
    console.error('Error fetching or writing LLM model data:', err);
    process.exit(1);
  }
}

fetchLLMModelData();
