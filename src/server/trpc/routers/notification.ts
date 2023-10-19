import { router, workspaceOwnerProcedure, workspaceProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';
import { sendNotification } from '../../model/notification';

export const notificationRouter = router({
  all: workspaceProcedure.query(({ input }) => {
    const workspaceId = input.workspaceId;

    return prisma.notification.findMany({
      where: {
        workspaceId,
      },
    });
  }),
  test: workspaceProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        type: z.string(),
        payload: z.object({}).passthrough(),
      })
    )
    .mutation(async ({ input }) => {
      await sendNotification(
        input,
        `${input.name} Notification Testing`,
        `This is Notification Testing`
      );
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
  delete: workspaceOwnerProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, workspaceId } = input;

      return await prisma.notification.delete({
        where: {
          workspaceId,
          id,
        },
      });
    }),
});
