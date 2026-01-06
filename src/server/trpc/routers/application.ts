import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { ApplicationModelSchema } from '../../prisma/zod/application.js';
import { ApplicationStoreInfoModelSchema } from '../../prisma/zod/applicationstoreinfo.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import {
  searchStoreApps,
  setupStoreInfo,
} from '../../model/application/storeInfo.js';
import {
  eventStatsQueryResultItemSchema,
  getApplicationEventStats,
} from '../../model/application/event.js';
import { ApplicationStoreInfoHistoryModelSchema } from '../../prisma/zod/applicationstoreinfohistory.js';

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
        summary: 'Get all applications',
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
        summary: 'Get application info',
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
        summary: 'Create application',
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
        summary: 'Update application',
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
        summary: 'Delete application',
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

      const application = await prisma.application.delete({
        where: {
          id: applicationId,
          workspaceId,
        },
      });

      return application;
    }),
  storeAppSearch: workspaceProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.APPLICATION],
        protect: true,
        method: 'GET',
        path: `/application/storeAppSearch`,
        summary: 'Search store apps',
      },
    })
    .input(
      z.object({
        keyword: z.string(),
        storeType: z.enum(['appstore', 'googleplay']),
      })
    )
    .output(
      z
        .object({
          id: z.string().optional(),
          appId: z.string(),
          title: z.string(),
          icon: z.string(),
        })
        .array()
    )
    .query(async ({ input }) => {
      const { keyword, storeType } = input;

      return searchStoreApps(keyword, storeType);
    }),
  storeInfoHistory: workspaceProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'GET',
        path: '/storeInfoHistory',
        summary: 'Get store info history',
      })
    )
    .input(
      z.object({
        applicationId: z.string(),
        storeType: z.enum(['appstore', 'googleplay']),
        storeId: z.string().optional(),
        startAt: z.number(),
        endAt: z.number(),
      })
    )
    .output(
      ApplicationStoreInfoHistoryModelSchema.pick({
        downloads: true,
        score: true,
        ratingCount: true,
        reviews: true,
        size: true,
        createdAt: true,
      }).array()
    )
    .query(async ({ input }) => {
      const { applicationId, storeType, storeId, startAt, endAt } = input;
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);

      const history = await prisma.applicationStoreInfoHistory.findMany({
        where: {
          applicationId,
          storeType,
          storeId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          downloads: true,
          score: true,
          ratingCount: true,
          reviews: true,
          size: true,
          createdAt: true,
        },
      });

      return history;
    }),
  eventStats: workspaceProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'GET',
        path: '/eventStats',
        summary: 'Get event stats',
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
        currentTotalSessionCount: z.number(),
        previousTotalSessionCount: z.number(),
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

      const startDate = new Date(startAt);
      const endDate = new Date(endAt);

      // Get application event stats
      const stats = await getApplicationEventStats(applicationId, {
        startDate,
        endDate,
        timezone,
        unit,
      });

      return stats;
    }),
  versionStats: workspaceProcedure
    .meta(
      buildApplicationOpenapi({
        method: 'GET',
        path: '/versionStats',
        summary: 'Get version distribution stats based on session updatedAt',
      })
    )
    .input(
      z.object({
        applicationId: z.string(),
        startAt: z.number(),
        endAt: z.number(),
      })
    )
    .output(
      z
        .object({
          version: z.string(),
          count: z.number(),
        })
        .array()
    )
    .query(async ({ input }) => {
      const { applicationId, startAt, endAt } = input;

      const startDate = new Date(startAt);
      const endDate = new Date(endAt);

      const versionStats = await prisma.applicationSession.groupBy({
        by: ['version'],
        where: {
          applicationId,
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      });

      return versionStats.map((item) => ({
        version: item.version || 'Unknown',
        count: item._count || 0,
      }));
    }),
});

function buildApplicationOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.APPLICATION],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/application/{applicationId}${meta.path}`,
    },
  };
}
