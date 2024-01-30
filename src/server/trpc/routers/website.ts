import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import { z } from 'zod';
import { getWebsiteOnlineUserCount } from '../../model/website';
import { prisma } from '../../model/_client';
import {
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  OPENAPI_TAG,
  SESSION_COLUMNS,
} from '../../utils/const';
import { parseDateRange } from '../../utils/common';
import { getSessionMetrics, getPageviewMetrics } from '../../model/website';
import { websiteInfoSchema } from '../../model/_schema';
import { OpenApiMeta } from 'trpc-openapi';
import { hostnameRegex } from '@tianji/shared';
import {
  addWorkspaceWebsite,
  getWorkspaceWebsiteStats,
} from '../../model/workspace';
import {
  websiteFilterSchema,
  websiteStatsSchema,
} from '../../model/_schema/filter';
import dayjs from 'dayjs';
import { QueryFilters } from '../../utils/prisma';

const websiteNameSchema = z.string().max(100);
const websiteDomainSchema = z.union([
  z.string().max(500).regex(hostnameRegex),
  z.string().max(500).ip(),
]);

export const websiteRouter = router({
  onlineCount: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/onlineCount',
      })
    )
    .input(
      z.object({
        websiteId: z.string(),
      })
    )
    .output(z.number())
    .query(async ({ input }) => {
      const websiteId = input.websiteId;

      const count = await getWebsiteOnlineUserCount(websiteId);

      return count;
    }),
  all: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: `/workspace/{workspaceId}/website/all`,
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
      },
    })
    .output(z.array(websiteInfoSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const websites = await prisma.website.findMany({
        where: {
          workspaceId,
        },
      });

      return websites;
    }),
  info: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/info',
      })
    )
    .input(
      z.object({
        websiteId: z.string(),
      })
    )
    .output(websiteInfoSchema.nullable())
    .query(async ({ input }) => {
      const { workspaceId, websiteId } = input;

      const website = await prisma.website.findUnique({
        where: {
          id: websiteId,
          workspaceId,
        },
      });

      return website;
    }),
  stats: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/stats',
      })
    )
    .input(
      z
        .object({
          websiteId: z.string(),
          startAt: z.number(),
          endAt: z.number(),
          unit: z.string().optional(),
        })
        .merge(websiteFilterSchema.partial())
    )
    .output(websiteStatsSchema)
    .query(async ({ input }) => {
      const {
        websiteId,
        timezone,
        url,
        referrer,
        title,
        os,
        browser,
        device,
        country,
        region,
        city,
        startAt,
        endAt,
      } = input;

      const { startDate, endDate, unit } = await parseDateRange({
        websiteId,
        startAt: Number(startAt),
        endAt: Number(endAt),
        unit: input.unit,
      });

      const diff = dayjs(endDate).diff(startDate, 'minutes');
      const prevStartDate = dayjs(startDate).subtract(diff, 'minutes').toDate();
      const prevEndDate = dayjs(endDate).subtract(diff, 'minutes').toDate();

      const filters = {
        startDate,
        endDate,
        timezone,
        unit,
        url,
        referrer,
        title,
        os,
        browser,
        device,
        country,
        region,
        city,
      } as QueryFilters;

      const [metrics, prevPeriod] = await Promise.all([
        getWorkspaceWebsiteStats(websiteId, {
          ...filters,
          startDate,
          endDate,
        }),
        getWorkspaceWebsiteStats(websiteId, {
          ...filters,
          startDate: prevStartDate,
          endDate: prevEndDate,
        }),
      ]);

      const stats = Object.keys(metrics[0]).reduce((obj, key) => {
        const current = Number(metrics[0][key]) || 0;
        const prev = Number(prevPeriod[0][key]) || 0;
        obj[key] = {
          value: current,
          prev,
        };
        return obj;
      }, {} as Record<string, { value: number; prev: number }>);

      return websiteStatsSchema.parse(stats);
    }),
  geoStats: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/geoStats',
      })
    )
    .input(
      z.object({
        websiteId: z.string(),
        startAt: z.number(),
        endAt: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          longitude: z.number(),
          latitude: z.number(),
          count: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const { websiteId, startAt, endAt } = input;

      const res = await prisma.websiteSession.groupBy({
        by: ['longitude', 'latitude'],
        where: {
          websiteId,
          longitude: { not: null },
          latitude: { not: null },
          createdAt: {
            gt: new Date(startAt),
            lte: new Date(endAt),
          },
        },
        _count: {
          _all: true,
        },
      });

      return res
        .filter((item) => item.longitude !== null && item.latitude !== null)
        .map((item) => {
          return {
            longitude: item.longitude!,
            latitude: item.latitude!,
            count: item._count._all,
          };
        });
    }),
  metrics: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/metrics',
      })
    )
    .input(
      z.object({
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
        url: z.string().optional(),
        referrer: z.string().optional(),
        title: z.string().optional(),
        os: z.string().optional(),
        browser: z.string().optional(),
        device: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
        language: z.string().optional(),
        event: z.string().optional(),
      })
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
        websiteId,
        type,
        startAt,
        endAt,
        url,
        referrer,
        title,
        os,
        browser,
        device,
        country,
        region,
        city,
        language,
        event,
      } = input;

      const { startDate, endDate } = await parseDateRange({
        websiteId,
        startAt,
        endAt,
      });

      const filters = {
        startDate,
        endDate,
        url,
        referrer,
        title,
        os,
        browser,
        device,
        country,
        region,
        city,
        language,
        event,
      };

      const column = FILTER_COLUMNS[type] || type;

      if (SESSION_COLUMNS.includes(type)) {
        const data = await getSessionMetrics(websiteId, column, filters);

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
        const data = await getPageviewMetrics(websiteId, column, filters);

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      return [];
    }),
  add: workspaceOwnerProcedure
    .meta({
      openapi: {
        method: 'POST',
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        path: `/workspace/{workspaceId}/website/add`,
      },
    })
    .input(
      z.object({
        name: websiteNameSchema,
        domain: websiteDomainSchema,
      })
    )
    .output(websiteInfoSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, name, domain } = input;

      const website = await addWorkspaceWebsite(workspaceId, name, domain);

      return website;
    }),
  updateInfo: workspaceOwnerProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'PUT',
        path: '/update',
      })
    )
    .input(
      z.object({
        websiteId: z.string().cuid2(),
        name: websiteNameSchema,
        domain: websiteDomainSchema,
        monitorId: z.string().cuid2().nullish(),
      })
    )
    .output(websiteInfoSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, websiteId, name, domain, monitorId } = input;

      const websiteInfo = await prisma.website.update({
        where: {
          id: websiteId,
          workspaceId,
        },
        data: {
          name,
          domain,
          monitorId,
        },
      });

      return websiteInfo;
    }),
});

function buildWebsiteOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.WEBSITE],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/website/{websiteId}${meta.path}`,
    },
  };
}
