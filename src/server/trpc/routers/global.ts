import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { env } from '../../utils/env.js';

export const globalRouter = router({
  config: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/global/config',
        tags: [OPENAPI_TAG.GLOBAL],
        description: 'Get Tianji system global config',
      },
    })
    .input(z.void())
    .output(
      z.object({
        allowRegister: z.boolean(),
        websiteId: z.string().optional(),
        amapToken: z.string().optional(),
        mapboxToken: z.string().optional(),
        alphaMode: z.boolean(),
        disableAnonymousTelemetry: z.boolean(),
        customTrackerScriptName: z.string().optional(),
        authProvider: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      return {
        allowRegister: env.allowRegister,
        websiteId: env.websiteId,
        amapToken: env.amapToken,
        mapboxToken: env.mapboxToken,
        alphaMode: env.alphaMode,
        disableAnonymousTelemetry: env.disableAnonymousTelemetry,
        customTrackerScriptName: env.customTrackerScriptName,
        authProvider: env.auth.provider,
      };
    }),
});
