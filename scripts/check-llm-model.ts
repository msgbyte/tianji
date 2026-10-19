import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  llmModelDataV1Schema,
  llmModelDataV2Schema,
  validateCanonicalJson,
} from '../src/server/utils/llmModelDataSchema.js';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const targets = [
  {
    relativePath: 'src/server/utils/model_prices_and_context_window.json',
    validate: (source: string) =>
      validateCanonicalJson(source, llmModelDataV1Schema),
  },
  {
    relativePath: 'src/server/utils/model_prices_and_context_window_v2.json',
    validate: (source: string) =>
      validateCanonicalJson(source, llmModelDataV2Schema),
  },
];

for (const { relativePath, validate } of targets) {
  try {
    const source = await fs.readFile(
      path.join(repoRoot, relativePath),
      'utf8'
    );
    validate(source);
    console.log(`Validated ${relativePath}`);
  } catch (error) {
    throw new Error(`Invalid ${relativePath}`, { cause: error });
  }
}
