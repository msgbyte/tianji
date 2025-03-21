import 'dotenv/config';
import { describe, expect, test } from 'vitest';
import { syncPostgresToClickHouse } from './cronjob.js';

describe.runIf(process.env.TEST_CH_CRONJOB)('cronjob', () => {
  test('should pass', { timeout: 100_000 }, async () => {
    const success = await syncPostgresToClickHouse();

    expect(success).toBe(true);
  });
});
