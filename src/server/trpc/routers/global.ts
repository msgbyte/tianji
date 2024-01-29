import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { env } from '../../utils/env';

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
      })
    )
    .query(async ({ input }) => {
      return {
        allowRegister: env.allowRegister,
        websiteId: env.websiteId,
        amapToken: env.amapToken,
        mapboxToken: env.mapboxToken,
      };
    }),
});

function checkEnvTrusty(env: string | undefined): boolean {
  return env === '1' || env === 'true';
}
