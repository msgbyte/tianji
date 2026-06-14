import { afterEach, describe, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('croner');
  vi.doUnmock('../cache/index.js');
  vi.doUnmock('../clickhouse/cronjob.js');
  vi.doUnmock('../model/aiGateway/quotaAlert.js');
  vi.doUnmock('../model/billing/cronjob.js');
  vi.doUnmock('../utils/env.js');
  vi.doUnmock('../utils/logger.js');
  vi.doUnmock('../utils/prometheus/client.js');
  vi.doUnmock('./daily.js');
  vi.doUnmock('./shared.js');
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('initCronjob', () => {
  test('runs AI Router log cleanup with the daily AI Gateway cleanup tasks', async () => {
    const dailyJobs: { trigger: () => Promise<void>; nextRun: () => Date }[] =
      [];
    const clearAIGatewayLogsDaily = vi.fn();
    const clearAIRouterLogsDaily = vi.fn();
    const clearWorkerExecutionDaily = vi.fn();

    vi.doMock('croner', () => ({
      Cron: vi.fn((_schedule: string, handler: () => Promise<void>) => {
        const job = {
          trigger: handler,
          nextRun: () => new Date('2026-06-13T00:00:00.000Z'),
        };
        dailyJobs.push(job);
        return job;
      }),
    }));
    vi.doMock('../cache/index.js', () => ({
      withDistributedLock: vi.fn(
        async (_key: string, task: () => Promise<boolean>) => task()
      ),
    }));
    vi.doMock('../clickhouse/cronjob.js', () => ({
      initClickHouseSyncCronjob: vi.fn(),
    }));
    vi.doMock('../model/aiGateway/quotaAlert.js', () => ({
      resetDailyAlertFlags: vi.fn(),
    }));
    vi.doMock('../model/billing/cronjob.js', () => ({
      checkWorkspaceUsage: vi.fn(),
    }));
    vi.doMock('../utils/env.js', () => ({
      env: {
        billing: { enable: false },
        clickhouse: { enable: false, sync: { enable: false } },
      },
    }));
    vi.doMock('../utils/logger.js', () => ({
      logger: { error: vi.fn(), info: vi.fn() },
    }));
    vi.doMock('../utils/prometheus/client.js', () => ({
      promCronCounter: { inc: vi.fn() },
    }));
    vi.doMock('./daily.js', () => ({
      autoDisableContinuousDownMonitorDaily: vi.fn(),
      clearAIGatewayLogsDaily,
      clearAIGatewayPayloadDaily: vi.fn(),
      clearAIRouterLogsDaily,
      clearAuditLogDaily: vi.fn(),
      clearMonitorDataDaily: vi.fn(),
      clearMonitorEventDaily: vi.fn(),
      clearWorkerExecutionDaily,
      clearWorkerExecutionPayloadDaily: vi.fn(),
      dailyHTTPCertCheckNotify: vi.fn(),
      dailyUpdateApplicationStoreInfo: vi.fn(),
      statDailyUsage: vi.fn(),
    }));
    vi.doMock('./shared.js', () => ({
      checkFeedEventsNotify: vi.fn(),
    }));

    const { initCronjob } = await import('./index.js');
    const { dailyJob } = initCronjob();
    await dailyJob.trigger();

    expect(clearAIRouterLogsDaily).toHaveBeenCalledTimes(1);
    expect(
      clearAIRouterLogsDaily.mock.invocationCallOrder[0]
    ).toBeGreaterThan(clearAIGatewayLogsDaily.mock.invocationCallOrder[0]);
    expect(clearAIRouterLogsDaily.mock.invocationCallOrder[0]).toBeLessThan(
      clearWorkerExecutionDaily.mock.invocationCallOrder[0]
    );
  });
});

describe.runIf(process.env.TEST_CRONJOB)('cronjob', () => {
  test(
    'run dailyjob',
    {
      timeout: 30_000,
    },
    async () => {
      const { initCronjob } = await import('./index.js');
      const { dailyJob } = initCronjob();
      await dailyJob.trigger();
    }
  );
});
