import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import {
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  OPENAPI_TAG,
  SESSION_COLUMNS,
} from '../../utils/const';
import { prisma } from '../../model/_client';
import { TelemetryModelSchema } from '../../prisma/zod';
import { OpenApiMeta } from 'trpc-openapi';
import {
  baseFilterSchema,
  baseStatsSchema,
  statsItemType,
} from '../../model/_schema/filter';
import {
  getTelemetryPageview,
  getTelemetryPageviewMetrics,
  getTelemetrySession,
  getTelemetrySessionMetrics,
  getTelemetryStats,
  getTelemetryUrlMetrics,
} from '../../model/telemetry';
import { BaseQueryFilters } from '../../utils/prisma';
import dayjs from 'dayjs';

export const telemetryRouter = router({
  all: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/all',
      })
    )
    .output(z.array(TelemetryModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const res = await prisma.telemetry.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return res;
    }),
  info: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/info',
      })
    )
    .input(
      z.object({
        telemetryId: z.string(),
      })
    )
    .output(TelemetryModelSchema.nullable())
    .query(async ({ input }) => {
      const { workspaceId, telemetryId } = input;

      const res = await prisma.telemetry.findUnique({
        where: {
          workspaceId,
          id: telemetryId,
        },
      });

      return res;
    }),
  allEventCount: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/allEventCount',
      })
    )
    .output(z.record(z.string(), z.number()))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const res = await prisma.telemetryEvent.groupBy({
        by: ['telemetryId'],
        where: {
          workspaceId,
        },
        _count: true,
      });

      return res.reduce<Record<string, number>>((prev, item) => {
        if (item.telemetryId) {
          prev[item.telemetryId] = item._count;
        }

        return prev;
      }, {});
    }),
  eventCount: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/eventCount',
      })
    )
    .input(
      z.object({
        telemetryId: z.string(),
      })
    )
    .output(z.number())
    .query(async ({ input }) => {
      const { workspaceId, telemetryId } = input;

      const count = await prisma.telemetryEvent.count({
        where: {
          workspaceId,
          telemetryId,
        },
      });

      return count;
    }),
  upsert: workspaceOwnerProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'POST',
        path: '/upsert',
      })
    )
    .input(
      z.object({
        telemetryId: z.string().optional(),
        name: z.string(),
      })
    )
    .output(TelemetryModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, telemetryId, name } = input;

      if (telemetryId) {
        return prisma.telemetry.update({
          where: {
            id: telemetryId,
            workspaceId,
          },
          data: {
            name,
          },
        });
      } else {
        return prisma.telemetry.create({
          data: {
            workspaceId,
            name,
          },
        });
      }
    }),
  delete: workspaceOwnerProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'POST',
        path: '/delete',
      })
    )
    .input(
      z.object({
        telemetryId: z.string(),
      })
    )
    .output(TelemetryModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, telemetryId } = input;

      return prisma.telemetry.delete({
        where: {
          id: telemetryId,
          workspaceId,
        },
      });
    }),
  pageviews: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/pageviews',
      })
    )
    .input(
      z
        .object({
          telemetryId: z.string(),
          startAt: z.number(),
          endAt: z.number(),
          unit: z.string().optional(),
        })
        .merge(baseFilterSchema.partial())
    )
    .output(z.object({ pageviews: z.any(), sessions: z.any() }))
    .query(async ({ input }) => {
      const {
        telemetryId,
        startAt,
        endAt,
        timezone,
        url,
        country,
        region,
        city,
      } = input;

      const startDate = new Date(startAt);
      const endDate = new Date(endAt);

      // const { startDate, endDate, unit } = await parseDateRange({
      //   websiteId,
      //   startAt: Number(startAt),
      //   endAt: Number(endAt),
      //   unit: String(input.unit),
      // });

      const filters = {
        startDate,
        endDate,
        unit: input.unit,
        timezone,
        url,
        country,
        region,
        city,
      };

      const [pageviews, sessions] = await Promise.all([
        getTelemetryPageview(telemetryId, filters as BaseQueryFilters),
        getTelemetrySession(telemetryId, filters as BaseQueryFilters),
      ]);

      return {
        pageviews,
        sessions,
      };
    }),
  metrics: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/metrics',
      })
    )
    .input(
      z
        .object({
          telemetryId: z.string(),
          type: z.enum(['source', 'url', 'event', 'referrer', 'country']),
          startAt: z.number(),
          endAt: z.number(),
        })
        .merge(baseFilterSchema.partial())
    )
    .output(
      z.array(
        z.object({
          x: z.string().nullable(),
          y: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const {
        telemetryId,
        type,
        startAt,
        endAt,
        timezone,
        url,
        country,
        region,
        city,
      } = input;

      const startDate = new Date(startAt);
      const endDate = new Date(endAt);

      // const { startDate, endDate } = await parseDateRange({
      //   websiteId,
      //   startAt,
      //   endAt,
      // });

      const filters = {
        startDate,
        endDate,
        timezone,
        url,
        country,
        region,
        city,
      };

      if (type === 'source') {
        const data = await getTelemetryUrlMetrics(telemetryId, filters);

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      const column = FILTER_COLUMNS[type] || type;

      if (SESSION_COLUMNS.includes(type)) {
        const data = await getTelemetrySessionMetrics(
          telemetryId,
          column,
          filters
        );

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      if (EVENT_COLUMNS.includes(type)) {
        const data = await getTelemetryPageviewMetrics(
          telemetryId,
          column,
          filters
        );

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      return [];
    }),
  stats: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/stats',
      })
    )
    .input(
      z
        .object({
          telemetryId: z.string(),
          startAt: z.number(),
          endAt: z.number(),
          unit: z.string().optional(),
        })
        .merge(baseFilterSchema.partial())
    )
    .output(baseStatsSchema)
    .query(async ({ input }) => {
      const {
        telemetryId,
        timezone,
        url,
        country,
        region,
        city,
        startAt,
        endAt,
      } = input;

      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      // const { startDate, endDate, unit } = await parseDateRange({
      //   telemetryId,
      //   startAt: Number(startAt),
      //   endAt: Number(endAt),
      //   unit: input.unit,
      // });

      const diff = dayjs(endDate).diff(startDate, 'minutes');
      const prevStartDate = dayjs(startDate).subtract(diff, 'minutes').toDate();
      const prevEndDate = dayjs(endDate).subtract(diff, 'minutes').toDate();

      const filters = {
        startDate,
        endDate,
        timezone,
        unit: input.unit,
        url,
        country,
        region,
        city,
      } as BaseQueryFilters;

      const [metrics, prevPeriod] = await Promise.all([
        getTelemetryStats(telemetryId, {
          ...filters,
          startDate,
          endDate,
        }),
        getTelemetryStats(telemetryId, {
          ...filters,
          startDate: prevStartDate,
          endDate: prevEndDate,
        }),
      ]);

      const stats = Object.keys(metrics[0]).reduce(
        (obj, key) => {
          const current = Number(metrics[0][key]) || 0;
          const prev = Number(prevPeriod[0][key]) || 0;
          obj[key] = {
            value: current,
            prev,
          };
          return obj;
        },
        {} as Record<string, { value: number; prev: number }>
      );

      return baseStatsSchema.parse(stats);
    }),
});

function buildTelemetryOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.TELEMETRY],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/telemetry${meta.path}`,
    },
  };
}
