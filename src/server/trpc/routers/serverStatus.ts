import { z } from 'zod';
import { router, workspaceAdminProcedure, workspaceProcedure } from '../trpc.js';
import {
  clearOfflineServerStatus,
  getServerStatusHistory,
} from '../../model/serverStatus.js';

export const serverStatusRouter = router({
  clearOfflineServerStatus: workspaceAdminProcedure.mutation(
    async ({ input }) => {
      const workspaceId = input.workspaceId;

      return clearOfflineServerStatus(workspaceId);
    }
  ),
  history: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        name: z.string(),
      })
    )
    .output(
      z.array(
        z.object({
          workspaceId: z.string(),
          name: z.string(),
          hostname: z.string(),
          timeout: z.number().optional(),
          updatedAt: z.number(),
          payload: z.any(),
        })
      )
    )
    .query(async ({ input }) => {
      const { workspaceId, name } = input;
      return getServerStatusHistory(workspaceId, name);
    }),
});
