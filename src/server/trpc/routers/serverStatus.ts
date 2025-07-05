import { z } from 'zod';
import {
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import {
  clearOfflineServerStatus,
  getServerStatusHistory,
  getServerMapFromCache,
} from '../../model/serverStatus.js';
import { OPENAPI_TAG } from '../../utils/const.js';

export const serverStatusRouter = router({
  clearOfflineServerStatus: workspaceAdminProcedure.mutation(
    async ({ input }) => {
      const workspaceId = input.workspaceId;

      return await clearOfflineServerStatus(workspaceId);
    }
  ),
  publicInfo: publicProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.MONITOR],
        method: 'POST',
        path: '/serverStatus/publicInfo',
        protect: false,
      },
    })
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        serverNames: z.array(z.string()),
      })
    )
    .output(
      z.record(
        z.string(),
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
      // TODO: auth check
      const { workspaceId, serverNames } = input;
      const serverMap = await getServerMapFromCache(workspaceId);

      // Filter only requested servers
      const filteredServerMap: Record<string, any> = {};
      serverNames.forEach((name) => {
        if (serverMap[name]) {
          filteredServerMap[name] = serverMap[name];
        }
      });

      return filteredServerMap;
    }),
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
