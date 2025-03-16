import { describe, test } from 'vitest';
import { dailyUpdateApplicationStoreInfo } from './daily.js';

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
