import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { OpenApiMeta } from 'trpc-openapi';
import {
  cancelSubscription,
  changeSubscription,
  createCheckoutBilling,
  getTierNameByvariantId,
  SubscriptionTierType,
} from '../../model/billing.js';
import { LemonSqueezySubscriptionModelSchema } from '../../prisma/zod/lemonsqueezysubscription.js';

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

      const res = await prisma.workspaceDailyUsage.aggregate({
        where: {
          workspaceId,
          date: {
            gte: new Date(startAt),
            lte: new Date(endAt),
          },
        },
        _sum: {
          websiteAcceptedCount: true,
          websiteEventCount: true,
          monitorExecutionCount: true,
          surveyCount: true,
          feedEventCount: true,
        },
      });

      return {
        websiteAcceptedCount: res._sum.websiteAcceptedCount ?? 0,
        websiteEventCount: res._sum.websiteEventCount ?? 0,
        monitorExecutionCount: res._sum.monitorExecutionCount ?? 0,
        surveyCount: res._sum.surveyCount ?? 0,
        feedEventCount: res._sum.feedEventCount ?? 0,
      };
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
        tier: z.string(),
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
        input.tier as SubscriptionTierType,
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
