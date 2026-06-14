import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  clearAIRouterLogsDaily,
  dailyUpdateApplicationStoreInfo,
} from './daily.js';
import { prisma } from '../model/_client.js';
import { env } from '../utils/env.js';

const originalAiGatewayLogClearDays = env.aiGatewayLogClearDays;

afterEach(() => {
  env.aiGatewayLogClearDays = originalAiGatewayLogClearDays;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('clearAIRouterLogsDaily', () => {
  test('deletes AI Router logs older than the AI Gateway log retention cutoff', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T00:00:00.000Z'));
    env.aiGatewayLogClearDays = 7;
    const deleteMany = vi
      .spyOn(prisma.aIRouterLogs, 'deleteMany')
      .mockResolvedValue({ count: 2 });

    await clearAIRouterLogsDaily();

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          lte: new Date('2026-06-06T00:00:00.000Z'),
        },
      },
    });
  });
});

describe.runIf(process.env.TEST_CRONJOB_APPLICATION)(
  'dailyUpdateApplicationStoreInfo',
  () => {
    test(
      'run dailyUpdateApplicationStoreInfo',
      {
        timeout: 30_000,
      },
      async () => {
        await dailyUpdateApplicationStoreInfo();
      }
    );
  }
);
