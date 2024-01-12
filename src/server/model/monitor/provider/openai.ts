import { z } from 'zod';
import { MonitorProvider } from './type';
import axios from 'axios';
import { saveMonitorStatus } from './_utils';
import _ from 'lodash';

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

const openaiSubscriptionSchema = z.object({
  object: z.string(),
  has_payment_method: z.boolean(),
  canceled: z.boolean(),
  canceled_at: z.any(),
  delinquent: z.any(),
  access_until: z.number(),
  soft_limit: z.number(),
  hard_limit: z.number(),
  system_hard_limit: z.number(),
  soft_limit_usd: z.number(),
  hard_limit_usd: z.number(),
  system_hard_limit_usd: z.number(),
  plan: z.object({
    title: z.string(),
    id: z.string(),
  }),
  primary: z.boolean(),
  billing_mechanism: z.any(),
  is_arrears_eligible: z.boolean(),
  max_balance: z.number(),
  auto_recharge_eligible: z.boolean(),
  auto_recharge_enabled: z.boolean(),
  auto_recharge_threshold: z.any(),
  auto_recharge_to_balance: z.any(),
  trust_tier: z.string(),
  account_name: z.string(),
  po_number: z.any(),
  billing_email: z.any(),
  tax_ids: z.any(),
  billing_address: z.object({
    city: z.string(),
    line1: z.string(),
    line2: z.string(),
    state: z.string(),
    country: z.string(),
    postal_code: z.string(),
  }),
  business_address: z.any(),
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

    const balance = (res.allUSD - res.totalUsed) * 100;

    await saveMonitorStatus(monitor.id, 'credit', {
      allUSD: res.allUSD,
      totalUsed: res.totalUsed,
    });

    if (balance <= 0) {
      return -1;
    }

    return balance;
  },
};

export async function getBillingCreditGrants(sessionKey: string) {
  const { data: count_info } = await axios.get(
    'https://api.openai.com/dashboard/billing/subscription',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionKey}`,
      },
    }
  );

  const allUSD = Number(
    openaiSubscriptionSchema.parse(count_info).system_hard_limit_usd.toFixed(2)
  );

  const { data } = await axios.get(
    'https://api.openai.com/dashboard/billing/credit_grants',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionKey}`,
      },
    }
  );

  const totalUsed = openaiCreditGrantsSchema.parse(data).total_used;

  return { allUSD, totalUsed };
}
