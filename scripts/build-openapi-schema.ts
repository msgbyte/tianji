import { trpcOpenapiDocument } from '../src/server/trpc';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.resolve(__dirname, '../website/static/openapi.json');
fs.writeJSON(target, trpcOpenapiDocument)
  .then(() => {
    console.log('openapi schema has been write into:', target);
  })
  .catch((err) => {
    console.error(err);
  });
