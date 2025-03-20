import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { ApplicationModelSchema } from '../../prisma/zod/application.js';
import { ApplicationStoreInfoModelSchema } from '../../prisma/zod/applicationstoreinfo.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { setupStoreInfo } from '../../model/application/storeInfo.js';
import { parseDateRange } from '../../utils/common.js';
import {
  eventStatsQueryResultItemSchema,
  getApplicationEventStats,
} from '../../model/application/event.js';

const applicationNameSchema = z.string().max(100);

const applicationCreateSchema = z.object({
  name: applicationNameSchema,
  appstoreId: z.string().regex(/^id.*/).optional(),
  playstoreId: z.string().optional(),
});

export const applicationRouter = router({
  all: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/workspace/{workspaceId}/application/all',
        tags: [OPENAPI_TAG.APPLICATION],
        protect: true,
      },
    })
    .output(z.array(ApplicationModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const applications = await prisma.application.findMany({
        where: {
          workspaceId,
          deletedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return applications;
    }),

  info: workspaceProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'GET',
        path: '/info',
      })
    )
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .output(
      ApplicationModelSchema.merge(
        z.object({
          applicationStoreInfos: ApplicationStoreInfoModelSchema.array(),
        })
      ).nullable()
    )
    .query(async ({ input }) => {
      const { workspaceId, applicationId } = input;

      const application = await prisma.application.findUnique({
        where: {
          id: applicationId,
          workspaceId,
          deletedAt: null,
        },
        include: {
          applicationStoreInfos: true,
        },
      });

      return application;
    }),

  create: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/workspace/{workspaceId}/application/create',
        tags: [OPENAPI_TAG.APPLICATION],
        protect: true,
      },
    })
    .input(applicationCreateSchema)
    .output(
      z.object({
        id: z.string(),
        workspaceId: z.string(),
        name: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, name, appstoreId, playstoreId } = input;

      const application = await prisma.application.create({
        data: {
          workspaceId,
          name,
        },
      });

      await setupStoreInfo(application.id, {
        appstoreId,
        playstoreId,
      });

      return application;
    }),

  update: workspaceAdminProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'PATCH',
        path: '/update',
      })
    )
    .input(
      z
        .object({
          applicationId: z.string(),
        })
        .merge(applicationCreateSchema)
    )
    .output(
      z.object({
        id: z.string(),
        workspaceId: z.string(),
        name: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, applicationId, name, appstoreId, playstoreId } =
        input;

      const application = await prisma.application.update({
        where: {
          id: applicationId,
          workspaceId,
          deletedAt: null,
        },
        data: {
          name,
        },
      });

      await setupStoreInfo(application.id, {
        appstoreId,
        playstoreId,
      });

      return application;
    }),

  delete: workspaceAdminProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'DELETE',
        path: '/delete',
      })
    )
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .output(
      z.object({
        id: z.string(),
        workspaceId: z.string(),
        name: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, applicationId } = input;

      const application = await prisma.application.update({
        where: {
          id: applicationId,
          workspaceId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return application;
    }),
  eventStats: workspaceProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'GET',
        path: '/eventStats',
      })
    )
    .input(
      z.object({
        applicationId: z.string(),
        startAt: z.number(),
        endAt: z.number(),
        timezone: z.string().optional(),
        unit: z.enum(['minute', 'hour', 'day', 'month', 'year']).optional(),
      })
    )
    .output(
      z.object({
        current: eventStatsQueryResultItemSchema.array(),
        previous: eventStatsQueryResultItemSchema.array(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        applicationId,
        startAt,
        endAt,
        timezone = ctx.timezone,
        unit,
      } = input;

      const { startDate, endDate } = await parseDateRange({
        websiteId: applicationId, // reuse the same function
        startAt: Number(startAt),
        endAt: Number(endAt),
        unit,
      });

      // Get application event stats
      const stats = await getApplicationEventStats(applicationId, {
        startDate,
        endDate,
        timezone,
        unit,
      });

      return stats;
    }),
});

function buildApplicationOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.WEBSITE],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/application/{applicationId}${meta.path}`,
    },
  };
}
