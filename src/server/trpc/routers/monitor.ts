import { router, workspaceOwnerProcedure, workspaceProcedure } from '../trpc';
import { prisma } from '../../model/_client';
import { z } from 'zod';

export const monitorRouter = router({
  all: workspaceProcedure.query(async ({ input }) => {
    const workspaceId = input.workspaceId;
    const monitors = await prisma.monitor.findMany({
      where: {
        workspaceId,
      },
    });

    return monitors;
  }),
  create: workspaceOwnerProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        active: z.boolean().default(true),
        interval: z.number().int().default(20),
        maxRetry: z.number().int().default(0),
        retryInterval: z.number().int().default(0),
        payload: z.object({}).passthrough(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        workspaceId,
        name,
        type,
        active,
        interval,
        maxRetry,
        retryInterval,
        payload,
      } = input;

      const monitor = await prisma.monitor.create({
        data: {
          workspaceId,
          name,
          type,
          active,
          interval,
          maxRetry,
          retryInterval,
          payload,
        },
      });

      return monitor;
    }),
});
