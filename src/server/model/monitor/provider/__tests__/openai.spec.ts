import { describe, test } from 'vitest';
import { getBillingCreditGrants } from '../openai';

describe.runIf(!!process.env.OPENAI_SESS_KEY)('openai', () => {
  test('getBillingCreditGrants should be ok', async () => {
    const res = await getBillingCreditGrants(
      String(process.env.OPENAI_SESS_KEY)
    );

    console.log(res);
  });
});
