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
import { baseFilterSchema } from '../../model/_schema/filter';
import {
  getTelemetryPageview,
  getTelemetryPageviewMetrics,
  getTelemetrySession,
  getTelemetrySessionMetrics,
} from '../../model/telemetry';
import { BaseQueryFilters } from '../../utils/prisma';

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
      const { telemetryId, startAt, endAt, url, country, region, city } = input;

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
          websiteId: z.string(),
          type: z.enum([
            'url',
            'language',
            'referrer',
            'browser',
            'os',
            'device',
            'country',
            'event',
          ]),
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
      const { websiteId, type, startAt, endAt, url, country, region, city } =
        input;

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
        url,
        country,
        region,
        city,
      };

      const column = FILTER_COLUMNS[type] || type;

      if (SESSION_COLUMNS.includes(type)) {
        const data = await getTelemetrySessionMetrics(
          websiteId,
          column,
          filters
        );

        if (type === 'language') {
          const combined: Record<string, any> = {};

          for (const { x, y } of data) {
            const key = String(x).toLowerCase().split('-')[0];

            if (combined[key] === undefined) {
              combined[key] = { x: key, y };
            } else {
              combined[key].y += y;
            }
          }

          return Object.values(combined).map((d) => ({
            x: d.x,
            y: Number(d.y),
          }));
        }

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      if (EVENT_COLUMNS.includes(type)) {
        const data = await getTelemetryPageviewMetrics(
          websiteId,
          column,
          filters
        );

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      return [];
    }),
});

function buildTelemetryOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.TELEMETRY],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}${meta.path}`,
    },
  };
}
