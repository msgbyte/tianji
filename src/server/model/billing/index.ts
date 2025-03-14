import {
  lemonSqueezySetup,
  createCheckout,
  updateSubscription,
  cancelSubscription as lsCancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';
import { env } from '../../utils/env.js';
import { prisma } from '../_client.js';
import { WorkspaceSubscriptionTier } from '@prisma/client';
import { checkWorkspaceUsageAndUpdateStatus } from './workspace.js';

export const billingAvailable = Boolean(env.billing.lemonSqueezy.apiKey);

if (billingAvailable) {
  lemonSqueezySetup({
    apiKey: env.billing.lemonSqueezy.apiKey,
    onError: (error) => console.error('Error!', error),
  });
}

export type SubscriptionTierType =
  keyof typeof env.billing.lemonSqueezy.tierVariantId;

export function getTierNameByvariantId(variantId: string) {
  const tierName = Object.keys(env.billing.lemonSqueezy.tierVariantId).find(
    (key) =>
      env.billing.lemonSqueezy.tierVariantId[key as SubscriptionTierType] ===
      variantId
  );

  if (!tierName) {
    throw new Error('Unknown Tier Name');
  }

  return tierName;
}

export function getTierEnumByVariantId(
  variantId: string
): WorkspaceSubscriptionTier {
  const name = getTierNameByvariantId(variantId);

  if (name === 'free') {
    return WorkspaceSubscriptionTier.FREE;
  } else if (name === 'pro') {
    return WorkspaceSubscriptionTier.PRO;
  } else if (name === 'team') {
    return WorkspaceSubscriptionTier.TEAM;
  }

  return WorkspaceSubscriptionTier.FREE; // not cool, fallback to free
}

export function checkIsValidProduct(storeId: string, variantId: string) {
  if (String(storeId) !== env.billing.lemonSqueezy.storeId) {
    return false;
  }

  if (
    !Object.values(env.billing.lemonSqueezy.tierVariantId).includes(variantId)
  ) {
    return false;
  }

  return true;
}

export async function createCheckoutBilling(
  workspaceId: string,
  userId: string,
  subscriptionTier: SubscriptionTierType,
  redirectUrl?: string
) {
  const variantId = env.billing.lemonSqueezy.tierVariantId[subscriptionTier];
  if (!variantId) {
    throw new Error('Unknown subscription tier');
  }

  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userInfo) {
    throw new Error('User not found');
  }

  const subscription = await prisma.lemonSqueezySubscription.findUnique({
    where: {
      workspaceId,
    },
  });

  if (subscription && subscription.status !== 'cancelled') {
    throw new Error('This workspace already has a subscription');
  }

  // not existed subscription
  const checkout = await createCheckout(
    env.billing.lemonSqueezy.storeId,
    variantId,
    {
      checkoutData: {
        name: userInfo.nickname ?? undefined,
        email: userInfo.email ?? undefined,
        custom: {
          userId,
          workspaceId,
        },
      },
      productOptions: {
        redirectUrl,
      },
    }
  );

  if (checkout.error) {
    throw checkout.error;
  }

  const checkoutData = checkout.data.data;

  return checkoutData;
}

export async function updateWorkspaceSubscription(
  workspaceId: string,
  subscriptionTier: WorkspaceSubscriptionTier
) {
  const res = await prisma.workspaceSubscription.upsert({
    where: {
      workspaceId,
    },
    create: {
      workspaceId,
      tier: subscriptionTier,
    },
    update: {
      tier: subscriptionTier,
    },
  });

  await checkWorkspaceUsageAndUpdateStatus(workspaceId);

  return res;
}

export async function changeSubscription(
  workspaceId: string,
  subscriptionTier: SubscriptionTierType
) {
  const variantId = env.billing.lemonSqueezy.tierVariantId[subscriptionTier];
  if (!variantId) {
    throw new Error('Unknown subscription tier');
  }

  const subscription = await prisma.lemonSqueezySubscription.findUnique({
    where: {
      workspaceId,
    },
  });

  if (!subscription) {
    throw new Error('Can not found existed subscription');
  }

  const res = await updateSubscription(subscription.subscriptionId, {
    variantId: Number(variantId),
  });

  if (res.error) {
    throw res.error;
  }

  return res.data.data;
}

export async function cancelSubscription(workspaceId: string) {
  const subscription = await prisma.lemonSqueezySubscription.findUnique({
    where: {
      workspaceId,
    },
  });

  if (!subscription) {
    throw new Error('Can not found existed subscription');
  }

  const res = await lsCancelSubscription(subscription.subscriptionId);

  if (res.error) {
    throw res.error;
  }

  return res.data.data;
}
