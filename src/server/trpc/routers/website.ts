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
import { hostnameRegex } from '../../../shared';
import { addWorkspaceWebsite } from '../../model/workspace';

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
