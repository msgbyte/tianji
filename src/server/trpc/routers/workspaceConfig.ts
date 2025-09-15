import { z } from 'zod';
import { router, workspaceAdminProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../model/_client.js';
import {
  getWorkspaceConfig,
  setWorkspaceConfig,
} from '../../model/workspace/config.js';

export const workspaceConfigRouter = router({
  // Get a specific config by key
  getConfig: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        key: z.string(),
      })
    )
    .query(async ({ input }) => {
      const config = await getWorkspaceConfig(input.workspaceId, input.key);

      return config;
    }),

  // Create or update a config
  setConfig: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        key: z.string(),
        value: z.any(), // JSON value can be any type
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, key, value } = input;

      const config = await setWorkspaceConfig(workspaceId, key, value);

      return config;
    }),

  // Delete a config
  deleteConfig: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        key: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const config = await prisma.workspaceConfig.findUnique({
        where: {
          workspaceId_key: {
            workspaceId: input.workspaceId,
            key: input.key,
          },
        },
      });

      if (!config) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Config not found',
        });
      }

      await prisma.workspaceConfig.delete({
        where: {
          workspaceId_key: {
            workspaceId: input.workspaceId,
            key: input.key,
          },
        },
      });

      return { success: true };
    }),
});
