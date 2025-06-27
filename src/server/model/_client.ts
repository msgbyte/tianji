import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

const debugEvent = {
  emit: 'event',
  level: 'query',
} as const;

const log = env.db.debug ? [debugEvent] : [];

export const prisma = new PrismaClient({
  log,
  transactionOptions: env.db.transactionOptions,
});

if (env.db.debug) {
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
