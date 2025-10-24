import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { z } from 'zod';
import {
  getWebsiteOnlineUserCount,
  getWorkspaceWebsitePageview,
  getWorkspaceWebsiteSession,
  getWorkspaceWebsiteStats,
} from '../../model/website/index.js';
import { prisma } from '../../model/_client.js';
import {
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  OPENAPI_TAG,
  SESSION_COLUMNS,
} from '../../utils/const.js';
import { parseDateRange } from '../../utils/common.js';
import {
  getWebsiteSessionMetrics,
  getWebsitePageviewMetrics,
} from '../../model/website/index.js';
import { websiteInfoSchema } from '../../model/_schema/index.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { hostnameRegex } from '@tianji/shared';
import {
  websiteFilterSchema,
  websiteStatsSchema,
} from '../../model/_schema/filter.js';
import dayjs from 'dayjs';
import {
  fetchDataByCursor,
  POSTGRESQL_DATE_FORMATS,
  WebsiteQueryFilters,
} from '../../utils/prisma.js';
import { WebsiteLighthouseReportStatus } from '@prisma/client';
import { WebsiteLighthouseReportModelSchema } from '../../prisma/zod/websitelighthousereport.js';
import { buildCursorResponseSchema } from '../../utils/schema.js';
import { sendBuildLighthouseMessageQueue } from '../../mq/producer.js';
import { getWorkspaceTierLimit } from '../../model/billing/limit.js';
import { TRPCError } from '@trpc/server';
import { createId } from '@paralleldrive/cuid2';
import { WebsiteModelSchema } from '../../prisma/zod/website.js';
import { getWebsiteInfoPublic } from '../../model/website/public.js';
import { getWebsitePublicStats } from '../../model/website/public.js';

const websiteNameSchema = z.string().max(100);
const websiteDomainSchema = z.union([
  z.string().max(500).regex(hostnameRegex),
  z.union([z.ipv4().max(500), z.ipv6().max(500)]),
]);
const metricsTypeSchema = z.enum([
  'url',
  'language',
  'referrer',
  'title',
  'browser',
  'os',
  'device',
  'country',
  'event',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);
const publicRangeSchema = z.enum(['realtime', '24h', '7d', '30d', '90d']);

export const websiteRouter = router({
  onlineCount: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/onlineCount',
        summary: 'Get online count',
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
        path: '/workspace/{workspaceId}/website/all',
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        summary: 'Get all websites',
      },
    })
    .output(z.array(websiteInfoSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const websites = await prisma.website.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return websites;
    }),
  allOverview: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/workspace/{workspaceId}/website/allOverview',
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        summary: 'Get overview',
      },
    })
    .output(z.record(z.string(), z.number()))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const websiteIds = (
        await prisma.website.findMany({
          where: {
            workspaceId,
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      const res = await prisma.websiteEvent.groupBy({
        by: ['websiteId'],
        where: {
          websiteId: {
            in: [...websiteIds],
          },
          createdAt: {
            gte: dayjs().subtract(1, 'day').toDate(),
          },
        },
        _count: true,
      });

      return res.reduce<Record<string, number>>((prev, item) => {
        if (item.websiteId) {
          prev[item.websiteId] = item._count;
        }

        return prev;
      }, {});
    }),
  info: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/info',
        summary: 'Get website info',
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
        summary: 'Get stats',
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
      } as WebsiteQueryFilters;

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

      return websiteStatsSchema.parse(stats);
    }),
  geoStats: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/geoStats',
        summary: 'Get geo stats',
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
        .map((item) => ({
          longitude: item.longitude!,
          latitude: item.latitude!,
          count: item._count._all,
        }));
    }),
  pageviews: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/pageviews',
        summary: 'Get pageviews',
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
    .output(z.object({ pageviews: z.any(), sessions: z.any() }))
    .query(async ({ input }) => {
      const {
        websiteId,
        startAt,
        endAt,
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
      } = input;

      const { startDate, endDate, unit } = await parseDateRange({
        websiteId,
        startAt: Number(startAt),
        endAt: Number(endAt),
        unit: String(input.unit),
      });

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
      };

      const [pageviews, sessions] = await Promise.all([
        getWorkspaceWebsitePageview(websiteId, filters as WebsiteQueryFilters),
        getWorkspaceWebsiteSession(websiteId, filters as WebsiteQueryFilters),
      ]);

      return {
        pageviews,
        sessions,
      };
    }),
  metrics: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/metrics',
        summary: 'Get metrics',
      })
    )
    .input(
      z.object({
        websiteId: z.string(),
        type: metricsTypeSchema,
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
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
        utm_term: z.string().optional(),
        utm_content: z.string().optional(),
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
        const data = await getWebsiteSessionMetrics(websiteId, column, filters);

        if (type === 'language') {
          const combined: Record<string, { x: string; y: number }> = {};

          for (const { x, y } of data) {
            const key = String(x).toLowerCase().split('-')[0];

            if (!combined[key]) {
              combined[key] = { x: key, y: Number(y) };
            } else {
              combined[key].y += Number(y);
            }
          }

          return Object.values(combined);
        }

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      if (EVENT_COLUMNS.includes(type)) {
        const data = await getWebsitePageviewMetrics(
          websiteId,
          column,
          filters
        );

        return data.map((d) => ({ x: d.x, y: Number(d.y) }));
      }

      return [];
    }),
  add: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'POST',
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        path: `/workspace/{workspaceId}/website/add`,
        summary: 'Add website',
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

      const [limit, websiteCount] = await Promise.all([
        getWorkspaceTierLimit(workspaceId),
        prisma.website.count({
          where: {
            workspaceId,
          },
        }),
      ]);

      if (
        limit.maxWebsiteCount !== -1 &&
        websiteCount >= limit.maxWebsiteCount
      ) {
        throw new Error('You have reached your website limit');
      }

      const website = await prisma.website.create({
        data: {
          name,
          domain,
          workspaceId,
        },
      });

      return website;
    }),
  delete: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        path: `/workspace/{workspaceId}/website/{websiteId}`,
        summary: 'Delete website',
      },
    })
    .input(
      z.object({
        websiteId: z.string(),
      })
    )
    .output(websiteInfoSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, websiteId } = input;

      const website = await prisma.website.delete({
        where: {
          id: websiteId,
          workspaceId,
        },
      });

      return website;
    }),
  updateInfo: workspaceAdminProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'PUT',
        path: '/update',
        summary: 'Update website',
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
  generateLighthouseReport: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'POST',
        path: '/generateLighthouseReport',
        summary: 'Generate Lighthouse report',
      })
    )
    .input(
      z.object({
        websiteId: z.string().cuid2(),
        url: z.string().url(),
      })
    )
    .output(z.string())
    .mutation(async ({ input }) => {
      const { workspaceId, websiteId, url } = input;

      const report = await prisma.websiteLighthouseReport.create({
        data: {
          url,
          websiteId,
          status: WebsiteLighthouseReportStatus.Pending,
          result: '',
        },
      });

      await sendBuildLighthouseMessageQueue(
        workspaceId,
        websiteId,
        report.id,
        url
      );

      return 'success';
    }),
  getLighthouseReport: workspaceProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'GET',
        path: '/getLighthouseReport',
        summary: 'Get Lighthouse report',
      })
    )
    .input(
      z.object({
        websiteId: z.string().cuid2(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .output(
      buildCursorResponseSchema(
        WebsiteLighthouseReportModelSchema.pick({
          id: true,
          status: true,
          url: true,
          createdAt: true,
        })
      )
    )
    .query(async ({ input }) => {
      const { websiteId, limit, cursor } = input;

      const { items, nextCursor } = await fetchDataByCursor(
        prisma.websiteLighthouseReport,
        {
          where: {
            websiteId,
          },
          select: {
            id: true,
            status: true,
            url: true,
            createdAt: true,
          },
          limit,
          cursor,
        }
      );

      return {
        items,
        nextCursor,
      };
    }),
  getLighthouseJSON: publicProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.WEBSITE],
        protect: true,
        method: 'GET',
        path: '/lighthouse/{lighthouseId}',
        summary: 'Get Lighthouse JSON',
      },
    })
    .input(
      z.object({
        lighthouseId: z.string().cuid2(),
      })
    )
    .output(z.record(z.string(), z.any()))
    .query(async ({ input }) => {
      const { lighthouseId } = input;

      const res = await prisma.websiteLighthouseReport.findFirst({
        where: {
          id: lighthouseId,
        },
        select: {
          result: true,
        },
      });

      try {
        return JSON.parse(res?.result ?? '{}');
      } catch (err) {
        return {};
      }
    }),

  // public
  getPublicInfoByShareId: publicProcedure
    .meta(
      buildWebsitePublicOpenapi({
        method: 'GET',
        path: '/{shareId}/info',
        summary: 'Get public info',
      })
    )
    .input(
      z.object({
        shareId: z.string(),
      })
    )
    .output(
      WebsiteModelSchema.pick({
        id: true,
        name: true,
        domain: true,
        shareId: true,
        createdAt: true,
        updatedAt: true,
      })
    )
    .query(async ({ input }) => {
      const website = await getWebsiteInfoPublic(input.shareId);

      if (!website) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Website not found',
        });
      }

      return website;
    }),
  getPublicStatsByShareId: publicProcedure
    .meta(
      buildWebsitePublicOpenapi({
        method: 'GET',
        path: '/{shareId}/stats',
        summary: 'Get public stats',
      })
    )
    .input(
      z.object({
        shareId: z.string(),
        range: z.enum(['realtime', '24h', '7d', '30d', '90d']).default('24h'),
      })
    )
    .output(
      z.object({
        pageviews: z.object({ value: z.number(), prev: z.number() }),
        visitors: z.object({ value: z.number(), prev: z.number() }),
        bounce_rate: z.object({ value: z.number(), prev: z.number() }),
        average_visit_duration: z.object({
          value: z.number(),
          prev: z.number(),
        }),
        pageviews_trend: z.array(
          z.object({
            date: z.string(),
            value: z.number(),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      const website = await getWebsiteInfoPublic(input.shareId);

      if (!website) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Website not found',
        });
      }

      const { currentRange, previousRange } = getRangeByPreset(
        input.range,
        ctx.timezone
      );

      return getWebsitePublicStats({
        websiteId: website.id,
        startAt: currentRange.startAt,
        endAt: currentRange.endAt,
        prevStartAt: previousRange.startAt,
        prevEndAt: previousRange.endAt,
        timezone: ctx.timezone,
        unit: currentRange.unit as keyof typeof POSTGRESQL_DATE_FORMATS,
      });
    }),
  getPublicMetricsByShareId: publicProcedure
    .meta(
      buildWebsitePublicOpenapi({
        method: 'GET',
        path: '/{shareId}/metrics',
        summary: 'Get public metrics',
      })
    )
    .input(
      z.object({
        shareId: z.string(),
        type: metricsTypeSchema,
        range: publicRangeSchema.default('24h'),
      })
    )
    .output(
      z.array(
        z.object({
          x: z.string().nullable(),
          y: z.number(),
          ratio: z.number(),
        })
      )
    )
    .query(async ({ input, ctx }) => {
      const website = await getWebsiteInfoPublic(input.shareId);

      if (!website) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Website not found',
        });
      }

      const { currentRange } = getRangeByPreset(input.range, ctx.timezone);
      const filters: WebsiteQueryFilters = {
        startDate: new Date(currentRange.startAt),
        endDate: new Date(currentRange.endAt),
        timezone: ctx.timezone,
      };

      const column = FILTER_COLUMNS[input.type] || input.type;

      if (SESSION_COLUMNS.includes(input.type)) {
        const data = await getWebsiteSessionMetrics(
          website.id,
          column,
          filters
        );

        const total = data.reduce((acc, item) => acc + Number(item.y) || 0, 0);

        if (input.type === 'language') {
          const combined: Record<string, { x: string; y: number }> = {};

          for (const { x, y } of data) {
            const key = String(x ?? '')
              .toLowerCase()
              .split('-')[0];

            if (!combined[key]) {
              combined[key] = { x: key, y: Number(y) };
            } else {
              combined[key].y += Number(y);
            }
          }

          return Object.values(combined).map((item) => ({
            x: item.x,
            y: item.y,
            ratio: total > 0 ? item.y / total : 0,
          }));
        }

        return data.map((d) => ({
          x: d.x,
          y: Number(d.y),
          ratio: total > 0 ? Number(d.y) / total : 0,
        }));
      }

      if (EVENT_COLUMNS.includes(input.type)) {
        const data = await getWebsitePageviewMetrics(
          website.id,
          column,
          filters
        );
        const total = data.reduce((acc, item) => acc + Number(item.y) || 0, 0);

        return data.map((d) => ({
          x: d.x,
          y: Number(d.y),
          ratio: total > 0 ? Number(d.y) / total : 0,
        }));
      }

      if (input.type === 'url') {
        const data = await getWebsitePageviewMetrics(
          website.id,
          column,
          filters
        );
        const total = data.reduce((acc, item) => acc + Number(item.y) || 0, 0);

        return data.map((d) => ({
          x: d.x,
          y: Number(d.y),
          ratio: total > 0 ? Number(d.y) / total : 0,
        }));
      }

      return [];
    }),
  createOrEnableShare: workspaceAdminProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'POST',
        path: '/share/enable',
        summary: 'Enable share',
      })
    )
    .input(
      z.object({
        websiteId: z.string().cuid2(),
      })
    )
    .output(
      z.object({
        shareUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const website = await prisma.website.findFirst({
        where: {
          id: input.websiteId,
          workspaceId: input.workspaceId,
          deletedAt: null,
        },
        select: {
          shareId: true,
        },
      });

      if (!website) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Website not found',
        });
      }

      const shareId = website.shareId ?? createId();

      if (!website.shareId) {
        await prisma.website.update({
          where: {
            id: input.websiteId,
          },
          data: {
            shareId,
          },
        });
      }

      return {
        shareUrl: buildWebsitePublicUrl(ctx.origin, shareId),
      };
    }),
  disableShare: workspaceAdminProcedure
    .meta(
      buildWebsiteOpenapi({
        method: 'POST',
        path: '/share/disable',
        summary: 'Disable share',
      })
    )
    .input(
      z.object({
        websiteId: z.string().cuid2(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    )
    .mutation(async ({ input }) => {
      await prisma.website.update({
        where: {
          id: input.websiteId,
          workspaceId: input.workspaceId,
        },
        data: {
          shareId: null,
        },
      });

      return { success: true };
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

function buildWebsitePublicOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.WEBSITE],
      protect: false,
      ...meta,
      path: `/website/public${meta.path}`,
    },
  };
}

function getRangeByPreset(range: string, timezone: string) {
  const now = dayjs().tz(timezone);
  if (range === 'realtime') {
    const end = now.endOf('minute').valueOf();
    const start = now.subtract(1, 'hour').startOf('minute').valueOf();
    return buildRange(start, end, 'minute');
  }
  if (range === '24h') {
    const end = now.endOf('hour').valueOf();
    const start = now.subtract(24, 'hour').startOf('hour').valueOf();
    return buildRange(start, end, 'hour');
  }
  if (range === '7d') {
    const end = now.endOf('day').valueOf();
    const start = now.subtract(7, 'day').startOf('day').valueOf();
    return buildRange(start, end, 'day');
  }
  if (range === '30d') {
    const end = now.endOf('day').valueOf();
    const start = now.subtract(30, 'day').startOf('day').valueOf();
    return buildRange(start, end, 'day');
  }

  const end = now.endOf('day').valueOf();
  const start = now.subtract(90, 'day').startOf('day').valueOf();
  return buildRange(start, end, 'day');
}

function buildRange(startAt: number, endAt: number, unit: string) {
  const diff = endAt - startAt;
  return {
    currentRange: {
      startAt,
      endAt,
      unit,
    },
    previousRange: {
      startAt: startAt - diff,
      endAt: endAt - diff,
      unit,
    },
  };
}

function buildWebsitePublicUrl(origin: string, shareId: string) {
  return `${origin}/website/public/${shareId}`;
}
