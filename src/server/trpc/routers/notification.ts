import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { z } from 'zod';
import { prisma } from '../../model/_client.js';
import { sendNotification } from '../../model/notification/index.js';
import { token } from '../../model/notification/token/index.js';

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
      await sendNotification(input, `${input.name} Notification Testing`, [
        token.title('Tianji: Insight into everything', 2),
        token.text(`This is Notification Testing from ${input.name}`),
        token.newline(),
        token.image('https://tianji.msgbyte.com/img/social-card.png'),
      ]);
    }),
  upsert: workspaceAdminProcedure
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
  delete: workspaceAdminProcedure
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
