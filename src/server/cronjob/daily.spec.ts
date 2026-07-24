import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  autoDisableContinuousDownMonitorDaily,
  clearAIRouterLogsDaily,
  dailyUpdateApplicationStoreInfo,
} from './daily.js';
import { prisma } from '../model/_client.js';
import { env } from '../utils/env.js';
import { monitorManager } from '../model/monitor/index.js';

const originalAiGatewayLogClearDays = env.aiGatewayLogClearDays;
const originalAutoDisableMonitorDays = env.autoDisableMonitorDays;

afterEach(() => {
  env.aiGatewayLogClearDays = originalAiGatewayLogClearDays;
  env.autoDisableMonitorDays = originalAutoDisableMonitorDays;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('autoDisableContinuousDownMonitorDaily', () => {
  test('uses synchronized stop when automatically disabling a monitor', async () => {
    env.autoDisableMonitorDays = 3;
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([
      {
        id: 'monitor-a',
        name: 'API',
        workspaceId: 'workspace-a',
      },
    ]);
    const setActive = vi
      .spyOn(monitorManager, 'setActive')
      .mockResolvedValue({
        monitor: {
          id: 'monitor-a',
          workspaceId: 'workspace-a',
          name: 'API',
          active: false,
        } as any,
        runner: undefined,
      });
    const update = vi
      .spyOn(prisma.monitor, 'update')
      .mockResolvedValue({} as any);
    vi.spyOn(prisma.monitorEvent, 'create').mockResolvedValue({} as any);

    await autoDisableContinuousDownMonitorDaily();

    expect(setActive).toHaveBeenCalledWith(
      'workspace-a',
      'monitor-a',
      false
    );
    expect(update).not.toHaveBeenCalled();
  });
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
