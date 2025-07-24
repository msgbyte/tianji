import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { env } from '../../utils/env.js';
import dayjs from 'dayjs';

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
        serverTimezone: z.string().optional(),
        authProvider: z.array(z.string()),
        smtpAvailable: z.boolean(),
        enableBilling: z.boolean(),
        enableAI: z.boolean(),
        enableFunctionWorker: z.boolean(),
      })
    )
    .query(async () => {
      return {
        allowRegister: env.allowRegister,
        websiteId: env.websiteId,
        amapToken: env.amapToken,
        mapboxToken: env.mapboxToken,
        alphaMode: env.alphaMode,
        disableAnonymousTelemetry: env.disableAnonymousTelemetry,
        customTrackerScriptName: env.customTrackerScriptName,
        serverTimezone: dayjs.tz.guess(),
        authProvider: env.auth.provider,
        smtpAvailable: env.smtp.enable,
        enableBilling: env.billing.enable,
        enableAI: env.openai.enable,
        enableFunctionWorker: env.enableFunctionWorker,
      };
    }),
});
