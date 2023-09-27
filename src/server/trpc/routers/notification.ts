import { router, workspaceOwnerProcedure, workspaceProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';

export const notificationRouter = router({
  getAll: workspaceProcedure.query(({ input }) => {
    const workspaceId = input.workspaceId;

    return prisma.notification.findMany({
      where: {
        workspaceId,
      },
    });
  }),
  upsert: workspaceOwnerProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        type: z.string(),
        payload: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, id, name, type, payload } = input;

      if (id) {
        // update
        return await prisma.notification.update({
          data: {
            name,
            type,
            payload,
          },
          where: {
            workspaceId,
            id,
          },
        });
      } else {
        // create
        return await prisma.notification.create({
          data: {
            workspaceId,
            name,
            type,
            payload,
          },
        });
      }
    }),
});
