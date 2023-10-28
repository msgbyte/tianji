import { trpcOpenapiDocument } from '../src/server/trpc';
import fs from 'fs-extra';
import path from 'path';

const target = path.resolve(__dirname, '../website/openapi.json');
fs.writeJSON(target, trpcOpenapiDocument)
  .then(() => {
    console.log('openapi schema has been write into:', target);
  })
  .catch((err) => {
    console.error(err);
  });
