import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import {
  cancelSubscription,
  changeSubscription,
  createCheckoutBilling,
  createCreditCheckout,
  getTierNameByvariantId,
  listCreditPacks,
  SubscriptionTierType,
} from '../../model/billing/index.js';
import {
  getWorkspaceCredit,
  getWorkspaceCreditBills,
} from '../../model/billing/credit.js';
import { LemonSqueezySubscriptionModelSchema } from '../../prisma/zod/lemonsqueezysubscription.js';
import {
  getWorkspaceTier,
  getWorkspaceUsage,
} from '../../model/billing/workspace.js';
import { getTierLimit, TierLimitSchema } from '../../model/billing/limit.js';
import { WorkspaceSubscriptionTier } from '@prisma/client';
import { env } from '../../utils/env.js';
import { WorkspaceBillModelSchema } from '../../prisma/zod/workspacebill.js';

export const billingRouter = router({
  usage: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/usage',
        description: 'get workspace usage',
      })
    )
    .input(
      z.object({
        startAt: z.number(),
        endAt: z.number(),
      })
    )
    .output(
      z.object({
        websiteAcceptedCount: z.number(),
        websiteEventCount: z.number(),
        monitorExecutionCount: z.number(),
        surveyCount: z.number(),
        feedEventCount: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId, startAt, endAt } = input;

      return getWorkspaceUsage(workspaceId, startAt, endAt);
    }),
  limit: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/limit',
        description: 'get workspace subscription limit',
      })
    )
    .output(TierLimitSchema)
    .query(async ({ input }) => {
      const { workspaceId } = input;
      const tier = await getWorkspaceTier(workspaceId);

      return getTierLimit(tier);
    }),
  currentTier: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/currentTier',
        description: 'get workspace current tier',
      })
    )
    .output(z.nativeEnum(WorkspaceSubscriptionTier))
    .query(({ input }) => {
      const { workspaceId } = input;

      return getWorkspaceTier(workspaceId);
    }),
  currentSubscription: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/currentSubscription',
        description: 'get workspace current subscription',
      })
    )
    .output(
      LemonSqueezySubscriptionModelSchema.merge(
        z.object({
          tier: z.string(),
        })
      ).nullable()
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const res = await prisma.lemonSqueezySubscription.findUnique({
        where: {
          workspaceId,
        },
      });

      if (!res) {
        return null;
      }

      return { ...res, tier: getTierNameByvariantId(res.variantId) };
    }),
  checkout: workspaceOwnerProcedure
    .input(
      z.object({
        tier: z.enum(['free', 'pro', 'team']),
        redirectUrl: z.string().optional(),
      })
    )
    .output(
      z.object({
        url: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, redirectUrl } = input;
      const userId = ctx.user.id;
      const checkout = await createCheckoutBilling(
        workspaceId,
        userId,
        input.tier,
        redirectUrl
      );

      const url = checkout.attributes.url;

      return { url };
    }),
  changePlan: workspaceOwnerProcedure
    .input(
      z.object({
        tier: z.string(),
      })
    )
    .output(z.string())
    .mutation(async ({ input }) => {
      const { workspaceId } = input;

      const subscription = await changeSubscription(
        workspaceId,
        input.tier as SubscriptionTierType
      );

      return subscription.id;
    }),
  cancelSubscription: workspaceOwnerProcedure
    .output(z.string())
    .mutation(async ({ input }) => {
      const { workspaceId } = input;
      const subscription = await cancelSubscription(workspaceId);

      return subscription.id;
    }),
  credit: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/credit',
        description: 'get workspace credit balance',
      })
    )
    .output(
      z.object({
        credit: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;
      const credit = await getWorkspaceCredit(workspaceId);

      return { credit };
    }),
  creditBills: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/credit/bills',
        description: 'list workspace credit bills',
      })
    )
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
    )
    .output(
      z.object({
        list: WorkspaceBillModelSchema.pick({
          id: true,
          workspaceId: true,
          type: true,
          amount: true,
          createdAt: true,
        }).array(),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId, page, pageSize } = input;

      return getWorkspaceCreditBills(workspaceId, { page, pageSize });
    }),
  creditPacks: workspaceProcedure
    .meta(
      buildBillingOpenapi({
        method: 'GET',
        path: '/credit/packs',
        description: 'list available credit packs',
      })
    )
    .output(
      z
        .object({
          id: z.string(),
          name: z.string(),
          variantId: z.string(),
          credit: z.number(),
          price: z.number(),
          currency: z.string(),
        })
        .array()
    )
    .query(async () => {
      const packs = await listCreditPacks();

      return packs.map((pack) => ({
        ...pack,
        currency: pack.currency ?? env.billing.lemonSqueezy.credit.currency,
      }));
    }),
  creditCheckout: workspaceOwnerProcedure
    .meta(
      buildBillingOpenapi({
        method: 'POST',
        path: '/credit/checkout',
        description: 'create credit checkout session',
      })
    )
    .input(
      z.object({
        packId: z.string(),
        redirectUrl: z.string().optional(),
      })
    )
    .output(z.object({ url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId } = input;
      const userId = ctx.user.id;

      const checkout = await createCreditCheckout(
        workspaceId,
        userId,
        input.packId,
        input.redirectUrl
      );

      return { url: checkout.attributes.url };
    }),
});

function buildBillingOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.BILLING],
      protect: true,
      ...meta,
      path: `/billing${meta.path}`,
    },
  };
}
