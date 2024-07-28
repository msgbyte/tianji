import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

const debugEvent = {
  emit: 'event',
  level: 'query',
} as const;

const log = env.dbDebug ? [debugEvent] : [];

export const prisma = new PrismaClient({
  log,
});

if (env.dbDebug) {
  prisma.$on('query', async (e) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // console.log(`${e.query} ${e.params}`);

    const params = JSON.parse(e.params);
    logger.info(
      e.query.replace(/\$(\d+)/g, (_, index) => {
        return "'" + params[Number(index) - 1] + "'";
      })
    );
  });
}
