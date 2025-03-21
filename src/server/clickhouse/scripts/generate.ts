import path from 'path';
import { MIGRATIONS_DIR } from '../consts.js';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import { logger } from '../../utils/logger.js';

const { name } = await inquirer.prompt<{ name: string }>([
  {
    name: 'name',
    type: 'input',
    message: 'migration name:',
    required: true,
  },
]);

const filepath = await createClickhouseMigration(name);

console.log('migration created:', filepath);

async function createClickhouseMigration(name: string) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  try {
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    await fs.writeFile(filePath, '-- Write your migration SQL here\n\n');
    logger.info(`Created migration file: ${filename}`);
    return filePath;
  } catch (err) {
    logger.error('Failed to create migration file:', err);
    throw err;
  }
}
