import { describe, expect, test } from 'vitest';
import { getBillingCreditGrants } from '../openai.js';

describe.runIf(!!process.env.TEST_OPENAI_SESS_KEY)('openai', () => {
  test('getBillingCreditGrants should be ok', async () => {
    const res = await getBillingCreditGrants(
      String(process.env.TEST_OPENAI_SESS_KEY)
    );

    expect(typeof res.allUSD).toBe('number');
    expect(typeof res.totalUsed).toBe('number');
  });
});
