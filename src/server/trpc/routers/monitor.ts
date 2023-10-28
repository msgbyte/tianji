import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import { prisma } from '../../model/_client';
import { z } from 'zod';
import { monitorManager } from '../../model/monitor';
import { MonitorInfoWithNotificationIds } from '../../../types';
import dayjs from 'dayjs';
import {
  monitorEventSchema,
  monitorInfoSchema,
  monitorInfoWithNotificationIdSchema,
  monitorStatusSchema,
} from '../../model/_schema';
import { OPENAPI_TAG } from '../../utils/const';
import { OpenApiMeta } from 'trpc-openapi';

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
  upsert: workspaceOwnerProcedure
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
        interval: z.number().int().default(20),
        notificationIds: z.array(z.string()).default([]),
        payload: z.object({}).passthrough(),
      })
    )
    .output(monitorInfoSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        workspaceId,
        name,
        type,
        active,
        interval,
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
        notificationIds,
        payload,
      });

      return monitor;
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

      return prisma.monitorData.findMany({
        where: {
          monitor: {
            id: monitorId,
            workspaceId,
          },
          createdAt: {
            gte: new Date(startAt),
            lte: new Date(endAt),
          },
        },
        select: {
          value: true,
          createdAt: true,
        },
      });
    }),
  changeActive: workspaceOwnerProcedure
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
    .output(monitorInfoSchema)
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, monitorId, active } = input;

      const monitor = await prisma.monitor.update({
        where: {
          workspaceId,
          id: monitorId,
        },
        data: {
          active,
        },
      });
      const runner = monitorManager.getRunner(monitorId);
      if (runner) {
        if (active === true) {
          runner.startMonitor();
          runner.createEvent(
            'UP',
            `Monitor [${monitor.name}] has been manual start`
          );
        } else {
          runner.stopMonitor();
          runner.createEvent(
            'DOWN',
            `Monitor [${monitor.name}] has been manual stop`
          );
        }
      }

      return monitor;
    }),
  recentData: workspaceProcedure
    .meta(
      buildMonitorOpenapi({
        method: 'GET',
        path: '/{monitorId}/recentData',
      })
    )
    .input(
      z.object({
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
      const { monitorId, take } = input;

      return prisma.monitorData.findMany({
        where: {
          monitorId,
        },
        take: -take,
        select: {
          value: true,
          createdAt: true,
        },
      });
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
      })
    )
    .output(z.array(monitorEventSchema))
    .query(async ({ input }) => {
      const { monitorId } = input;

      const list = await prisma.monitorEvent.findMany({
        where: {
          monitorId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });

      return list;
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
