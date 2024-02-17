import { z } from 'zod';
import { router, workspaceProcedure } from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { prisma } from '../../model/_client';

export const billingRouter = router({
  usage: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/usage',
        tags: [OPENAPI_TAG.BILLING],
        description: 'get workspace usage',
      },
    })
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
        },
      });

      return {
        websiteAcceptedCount: res._sum.websiteAcceptedCount ?? 0,
        websiteEventCount: res._sum.websiteEventCount ?? 0,
        monitorExecutionCount: res._sum.monitorExecutionCount ?? 0,
      };
    }),
});
