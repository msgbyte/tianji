import { describe, test } from 'vitest';
import { dailyUpdateApplicationStoreInfo, initCronjob } from './index.js';

describe.runIf(process.env.TEST_CRONJOB)('cronjob', () => {
  const { dailyJob } = initCronjob();

  test(
    'run dailyjob',
    {
      timeout: 30_000,
    },
    async () => {
      await dailyJob.trigger();
    }
  );
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
