import { z } from 'zod';
import { MonitorProvider } from './type';
import axios from 'axios';
import { saveMonitorStatus } from './_utils';

const openaiCreditGrantsSchema = z.object({
  object: z.string(),
  total_granted: z.number(),
  total_used: z.number(),
  total_available: z.number(),
  total_paid_available: z.number(),
  grants: z.object({
    object: z.string(),
    data: z.array(
      z.object({
        object: z.string(),
        id: z.string(),
        grant_amount: z.number(),
        used_amount: z.number(),
        effective_at: z.number(),
        expires_at: z.number(),
      })
    ),
  }),
});

export const openai: MonitorProvider<{
  sessionKey: string;
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { sessionKey } = monitor.payload;

    const res = await getBillingCreditGrants(sessionKey);

    const balance = res.total_granted - res.total_used;

    await saveMonitorStatus(monitor.id, 'credit', {
      totalGranted: res.total_granted,
      totalUsed: res.total_used,
      totalAvailable: res.total_available,
      totalPaidAvailable: res.total_paid_available,
    });

    if (balance <= 0) {
      return -1;
    }

    return balance;
  },
};

async function getBillingCreditGrants(sessionKey: string) {
  const { data } = await axios.get(
    'https://api.openai.com/dashboard/billing/credit_grants',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionKey}`,
      },
    }
  );

  return openaiCreditGrantsSchema.parse(data);
}
