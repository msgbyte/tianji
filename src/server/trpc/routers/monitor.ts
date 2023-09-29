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
  get: workspaceProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { id, workspaceId } = input;
      const monitor = await prisma.monitor.findUnique({
        where: {
          id,
          workspaceId,
        },
      });

      return monitor;
    }),
  upsert: workspaceOwnerProcedure
    .input(
      z.object({
        id: z.string().optional(),
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
        id,
        workspaceId,
        name,
        type,
        active,
        interval,
        maxRetry,
        retryInterval,
        payload,
      } = input;

      if (id) {
        return prisma.monitor.update({
          data: {
            name,
            type,
            active,
            interval,
            maxRetry,
            retryInterval,
            payload,
          },
          where: {
            id,
            workspaceId,
          },
        });
      } else {
        return prisma.monitor.create({
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
      }
    }),
});
