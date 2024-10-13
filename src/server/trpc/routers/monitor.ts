import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { prisma } from '../../model/_client.js';
import { z } from 'zod';
import {
  getMonitorData,
  getMonitorPublicInfos,
  getMonitorRecentData,
  getMonitorSummaryWithDay,
  monitorManager,
} from '../../model/monitor/index.js';
import dayjs from 'dayjs';
import {
  monitorEventSchema,
  monitorInfoWithNotificationIdSchema,
  monitorStatusSchema,
} from '../../model/_schema/index.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { OpenApiMeta } from 'trpc-openapi';
import {
  MonitorModelSchema,
  MonitorStatusPageModelSchema,
} from '../../prisma/zod/index.js';
import { runCodeInVM } from '../../model/monitor/provider/custom.js';
import { createAuditLog } from '../../model/auditLog.js';
import {
  MonitorInfoWithNotificationIds,
  monitorPublicInfoSchema,
} from '../../model/_schema/monitor.js';
import { monitorPageManager } from '../../model/monitor/page/manager.js';

export const monitorRouter = router({
  all: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/all',
      })
    )
    .output(z.array(monitorInfoWithNotificationIdSchema))
    .query(async ({ input }) => {
      const workspaceId = input.workspaceId;
      const monitors = await prisma.monitor.findMany({
        where: {
          workspaceId,
        },
        include: {
          notifications: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return monitors as MonitorInfoWithNotificationIds[];
    }),
  get: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/{monitorId}',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
      })
    )
    .output(monitorInfoWithNotificationIdSchema.nullable())
    .query(async ({ input }) => {
      const { monitorId, workspaceId } = input;
      const monitor = await prisma.monitor.findUnique({
        where: {
          id: monitorId,
          workspaceId,
        },
        include: {
          notifications: {
            select: {
              id: true,
            },
          },
        },
      });

      return monitor;
    }),
  getPublicInfo: publicProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.MONITOR],
        protect: false,
        method: 'POST',
        path: '/monitor/getPublicInfo',
      },
    })
    .input(
      z.object({
        monitorIds: z.array(z.string()),
      })
    )
    .output(z.array(monitorPublicInfoSchema))
    .query(async ({ input }) => {
      const { monitorIds } = input;

      return getMonitorPublicInfos(monitorIds);
    }),
  upsert: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'POST',
        path: '/upsert',
      })
    )
    .input(
      z.object({
        id: z.string().cuid2().optional(),
        name: z.string(),
        type: z.string(),
        active: z.boolean().default(true),
        interval: z.number().int().min(5).max(10000).default(20),
        maxRetries: z.number().int().min(0).max(10).default(0),
        trendingMode: z.boolean().default(false),
        notificationIds: z.array(z.string()).default([]),
        payload: z.object({}).passthrough(),
      })
    )
    .output(MonitorModelSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        workspaceId,
        name,
        type,
        active,
        interval,
        maxRetries,
        trendingMode,
        notificationIds,
        payload,
      } = input;

      const monitor = await monitorManager.upsert({
        id,
        workspaceId,
        name,
        type,
        active,
        interval,
        maxRetries,
        trendingMode,
        notificationIds,
        payload,
      });

      return monitor;
    }),
  delete: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'DELETE',
        path: '/{monitorId}',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
      })
    )
    .output(MonitorModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, monitorId } = input;

      return monitorManager.delete(workspaceId, monitorId);
    }),
  testCustomScript: workspaceAdminProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .output(
      z.object({
        logger: z.array(z.array(z.any())),
        result: z.number(),
        usage: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await runCodeInVM(input.code);

      return {
        logger: res.logger,
        result: res.result ?? -1,
        usage: res.usage,
      };
    }),
  data: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/{monitorId}/data',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
        startAt: z.number(),
        endAt: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          value: z.number(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ input }) => {
      const { monitorId, workspaceId, startAt, endAt } = input;

      return getMonitorData(
        workspaceId,
        monitorId,
        new Date(startAt),
        new Date(endAt)
      );
    }),
  changeActive: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'PATCH',
        path: '/{monitorId}/changeActive',
      })
    )
    .input(
      z.object({
        monitorId: z.string(),
        active: z.boolean(),
      })
    )
    .output(MonitorModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, monitorId, active } = input;
      const user = ctx.user;

      const monitor = await prisma.monitor.update({
        where: {
          workspaceId,
          id: monitorId,
        },
        data: {
          active,
        },
        include: {
          notifications: true,
        },
      });
      let runner = monitorManager.getRunner(monitorId);
      if (!runner) {
        runner = monitorManager.createRunner(monitor);
      }

      if (active === true) {
        runner.startMonitor();
        runner.createEvent(
          'UP',
          `Monitor [${monitor.name}] has been manual start`
        );
        createAuditLog({
          workspaceId: workspaceId,
          relatedId: monitorId,
          relatedType: 'Monitor',
          content: `Monitor(id: ${monitor.id}) manual start by ${String(
            user.username
          )}(${String(user.id)})`,
        });
      } else {
        runner.stopMonitor();
        runner.createEvent(
          'DOWN',
          `Monitor [${monitor.name}] has been manual stop`
        );
        createAuditLog({
          workspaceId: workspaceId,
          relatedId: monitorId,
          relatedType: 'Monitor',
          content: `Monitor(id: ${monitor.id}) manual stop by ${String(
            user.username
          )}(${String(user.id)})`,
        });
      }

      return monitor;
    }),
  recentData: publicProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        protect: false,
        path: '/{monitorId}/recentData',
      })
    )
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        monitorId: z.string().cuid2(),
        take: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          value: z.number(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ input }) => {
      const { workspaceId, monitorId, take } = input;

      return getMonitorRecentData(workspaceId, monitorId, take);
    }),
  publicSummary: publicProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        protect: false,
        path: '/{monitorId}/publicSummary',
      })
    )
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        monitorId: z.string().cuid2(),
      })
    )
    .output(
      z.array(
        z.object({
          day: z.string(),
          totalCount: z.number(),
          upCount: z.number(),
          upRate: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const { monitorId } = input;
      const summary = await getMonitorSummaryWithDay(monitorId, 30);

      return summary;
    }),
  publicData: publicProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        protect: false,
        path: '/{monitorId}/publicData',
      })
    )
    .input(
      z.object({
        workspaceId: z.string().cuid2(),
        monitorId: z.string().cuid2(),
      })
    )
    .output(
      z.array(
        z.object({
          value: z.number(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ input }) => {
      const { workspaceId, monitorId } = input;

      return getMonitorData(
        workspaceId,
        monitorId,
        dayjs().subtract(1, 'days').toDate(),
        dayjs().toDate()
      );
    }),
  dataMetrics: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/{monitorId}/dataMetrics',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
      })
    )
    .output(
      z.object({
        recent1DayAvg: z.number(),
        recent1DayOnlineCount: z.number(),
        recent1DayOfflineCount: z.number(),
        recent30DayOnlineCount: z.number(),
        recent30DayOfflineCount: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { monitorId } = input;
      const now = dayjs();

      const [
        recent1DayAvg,
        recent1DayOnlineCount,
        recent1DayOfflineCount,
        recent30DayOnlineCount,
        recent30DayOfflineCount,
      ] = await Promise.all([
        prisma.monitorData
          .aggregate({
            _avg: {
              value: true,
            },
            where: {
              monitorId,
              createdAt: {
                lte: now.toDate(),
                gte: now.subtract(1, 'day').toDate(),
              },
            },
          })
          .then((res) => res._avg.value ?? -1),
        prisma.monitorData.count({
          where: {
            monitorId,
            createdAt: {
              lte: now.toDate(),
              gte: now.subtract(1, 'day').toDate(),
            },
            value: {
              gte: 0,
            },
          },
        }),
        prisma.monitorData.count({
          where: {
            monitorId,
            createdAt: {
              lte: now.toDate(),
              gte: now.subtract(1, 'day').toDate(),
            },
            value: -1,
          },
        }),
        prisma.monitorData.count({
          where: {
            monitorId,
            createdAt: {
              lte: now.toDate(),
              gte: now.subtract(30, 'day').toDate(),
            },
            value: {
              gte: 0,
            },
          },
        }),
        prisma.monitorData.count({
          where: {
            monitorId,
            createdAt: {
              lte: now.toDate(),
              gte: now.subtract(30, 'day').toDate(),
            },
            value: -1,
          },
        }),
      ]);

      return {
        recent1DayAvg,
        recent1DayOnlineCount,
        recent1DayOfflineCount,
        recent30DayOnlineCount,
        recent30DayOfflineCount,
      };
    }),
  events: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/events',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2().optional(),
        limit: z.number().default(20),
      })
    )
    .output(z.array(monitorEventSchema))
    .query(async ({ input }) => {
      const { workspaceId, monitorId, limit } = input;

      const list = await prisma.monitorEvent.findMany({
        where: {
          monitorId,
          monitor: {
            workspaceId: workspaceId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return list;
    }),
  clearEvents: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'DELETE',
        path: '/clearEvents',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
      })
    )
    .output(z.number())
    .mutation(async ({ input }) => {
      const { workspaceId, monitorId } = input;

      const { count } = await prisma.monitorEvent.deleteMany({
        where: {
          monitor: {
            id: monitorId,
            workspaceId,
          },
        },
      });

      return count;
    }),
  clearData: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'DELETE',
        path: '/clearData',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
      })
    )
    .output(z.number())
    .mutation(async ({ input }) => {
      const { workspaceId, monitorId } = input;

      const { count } = await prisma.monitorData.deleteMany({
        where: {
          monitor: {
            id: monitorId,
            workspaceId,
          },
        },
      });

      return count;
    }),
  getStatus: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/{monitorId}/status',
      })
    )
    .input(
      z.object({
        monitorId: z.string().cuid2(),
        statusName: z.string(),
      })
    )
    .output(monitorStatusSchema.nullable())
    .query(async ({ input }) => {
      const { monitorId, statusName } = input;

      return prisma.monitorStatus.findUnique({
        where: {
          monitorId_statusName: {
            monitorId,
            statusName,
          },
        },
      });
    }),
  getAllPages: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/getAllPages',
      })
    )
    .output(z.array(MonitorStatusPageModelSchema))
    .query(({ input }) => {
      const { workspaceId } = input;

      return prisma.monitorStatusPage.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }),
  getPageInfo: publicProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.MONITOR],
        method: 'GET',
        path: '/monitor/getPageInfo',
      },
    })
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .output(MonitorStatusPageModelSchema.nullable())
    .query(({ input }) => {
      const { slug } = input;

      return prisma.monitorStatusPage.findUnique({
        where: {
          slug,
        },
      });
    }),
  createPage: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'POST',
        path: '/createStatusPage',
      })
    )
    .input(
      z
        .object({
          slug: z.string(),
          title: z.string(),
        })
        .merge(
          MonitorStatusPageModelSchema.pick({
            description: true,
            body: true,
            monitorList: true,
            domain: true,
          }).partial()
        )
    )
    .output(MonitorStatusPageModelSchema)
    .mutation(async ({ input }) => {
      const {
        workspaceId,
        slug,
        title,
        description,
        body,
        monitorList,
        domain,
      } = input;

      const existSlugCount = await prisma.monitorStatusPage.count({
        where: {
          slug,
        },
      });

      if (existSlugCount > 0) {
        throw new Error('This slug has been existed');
      }

      if (domain && !(await monitorPageManager.checkDomain(domain))) {
        throw new Error('This domain has been used');
      }

      const page = await prisma.monitorStatusPage.create({
        data: {
          workspaceId,
          slug,
          title,
          description,
          body,
          monitorList,
          domain: domain || null, // make sure not ''
        },
      });

      if (page.domain) {
        monitorPageManager.updatePageDomain(page.domain, {
          workspaceId: page.workspaceId,
          pageId: page.id,
          slug: page.slug,
        });
      }

      return page;
    }),
  editPage: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'PATCH',
        path: '/updateStatusPage',
      })
    )
    .input(
      MonitorStatusPageModelSchema.pick({
        id: true,
      }).merge(
        MonitorStatusPageModelSchema.pick({
          slug: true,
          title: true,
          description: true,
          body: true,
          monitorList: true,
          domain: true,
        }).partial()
      )
    )
    .output(MonitorStatusPageModelSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        workspaceId,
        slug,
        title,
        description,
        body,
        monitorList,
        domain,
      } = input;

      if (slug) {
        const existSlugCount = await prisma.monitorStatusPage.count({
          where: {
            slug,
            id: {
              not: id,
            },
          },
        });

        if (existSlugCount > 0) {
          throw new Error('This slug has been existed');
        }
      }

      if (domain && !(await monitorPageManager.checkDomain(domain, id))) {
        throw new Error('This domain has been used by others');
      }

      const page = await prisma.monitorStatusPage.update({
        where: {
          id,
          workspaceId,
        },
        data: {
          slug,
          title,
          description,
          body,
          monitorList,
          domain: domain || null,
        },
      });

      if (page.domain) {
        monitorPageManager.updatePageDomain(page.domain, {
          workspaceId: page.workspaceId,
          pageId: page.id,
          slug: page.slug,
        });
      }

      return page;
    }),
  deletePage: workspaceAdminProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'DELETE',
        path: '/deleteStatusPage',
      })
    )
    .input(
      MonitorStatusPageModelSchema.pick({
        id: true,
      })
    )
    .output(MonitorStatusPageModelSchema)
    .mutation(async ({ input }) => {
      const { id, workspaceId } = input;

      const res = await prisma.monitorStatusPage.delete({
        where: {
          id,
          workspaceId,
        },
      });

      return res;
    }),
});

function buildMonitorOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.MONITOR],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/monitor${meta.path}`,
    },
  };
}
