import { TRPCError } from '@trpc/server';
import { router, workspaceProcedure } from '../../trpc.js';
import {
  insightsQueryEventsSchema,
  insightsQuerySchema,
  insightTypeSchema,
} from '../../../utils/schema.js';
import { z } from 'zod';
import { prisma } from '../../../model/_client.js';
import { EVENT_TYPE, INIT_WORKSPACE_ID } from '../../../utils/const.js';
import { stringifyDateType } from '../../../utils/common.js';
import { queryEvents, queryInsight } from '../../../model/insights/index.js';
import {
  insightsSurveyBuiltinFields,
  insightsWebsiteBuiltinFields,
} from '../../../model/insights/utils.js';
import { uniq } from 'lodash-es';
import {
  insightsLongTableWarehouseEvents,
  insightsLongTableWarehouseFilterParams,
} from '../../../model/insights/warehouse/longTable.js';
import {
  findWarehouseApplication,
  getWarehouseApplications,
} from '../../../model/insights/warehouse/utils.js';
import {
  insightsWideTableWarehouseEvents,
  insightsWideTableWarehouseFilterParams,
} from '../../../model/insights/warehouse/wideTable.js';
import { insightCohortsRouter } from './cohorts.js';
import { warehouseRouter } from './warehouse.js';

/**
 * Insight queries read data by `insightId` alone, so the target must be
 * checked against the caller's workspace before any query runs.
 */
const insightTargetProcedure = workspaceProcedure
  .input(
    z.object({
      insightId: z.string(),
      insightType: insightTypeSchema,
    })
  )
  .use(async ({ input, next }) => {
    const { workspaceId, insightId, insightType } = input;
    const where = { id: insightId, workspaceId };
    const select = { id: true };
    const target =
      insightType === 'website'
        ? await prisma.website.findUnique({ where, select })
        : insightType === 'survey'
          ? await prisma.survey.findUnique({ where, select })
          : insightType === 'aigateway'
            ? await prisma.aIGateway.findUnique({ where, select })
            : await findWarehouseApplication(workspaceId, insightId);

    if (!target) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Insight target not found',
      });
    }

    return next();
  });

export const insightsRouter = router({
  query: insightTargetProcedure
    .input(insightsQuerySchema)
    .query(async ({ input, ctx }) => {
      return await queryInsight(input, {
        timezone: ctx.timezone,
      });
    }),
  queryEvents: insightTargetProcedure
    .input(insightsQueryEventsSchema)
    .query(async ({ input, ctx }) => {
      return queryEvents(input, {
        timezone: ctx.timezone,
      });
    }),
  eventNames: insightTargetProcedure.query(async ({ input }) => {
    const { insightId, insightType } = input;

    if (insightType === 'website') {
      const res = await prisma.websiteEvent.groupBy({
        by: ['eventName', 'eventType'],
        where: {
          websiteId: insightId,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return res.map((item) => ({
        name:
          item.eventType === EVENT_TYPE.pageView
            ? '$page_view'
            : (item.eventName ?? '<null>'),
        count: item._count.id,
      }));
    }

    if (insightType === 'survey') {
      return [];
    }

    if (insightType === 'warehouse') {
      const application = await findWarehouseApplication(
        input.workspaceId,
        insightId
      );
      let events: string[] = [];
      if (application?.type === 'wideTable') {
        events = await insightsWideTableWarehouseEvents(
          insightId,
          input.workspaceId
        );
      } else {
        events = await insightsLongTableWarehouseEvents(
          insightId,
          input.workspaceId
        );
      }

      return events.map((item) => ({
        name: item,
        count: 0,
      }));
    }

    return [];
  }),
  filterParams: insightTargetProcedure.query(async ({ input }) => {
    const { insightId, insightType } = input;

    if (insightType === 'website') {
      const res = await prisma.websiteEventData.groupBy({
        by: ['eventKey', 'dataType'],
        where: {
          websiteId: insightId,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return [
        ...insightsWebsiteBuiltinFields.map(({ name }) => ({
          name,
          source: 'builtin' as const,
          type: 'string' as const,
          count: 0,
        })),
        ...res.map((item) => ({
          name: item.eventKey,
          source: 'custom' as const,
          type: stringifyDateType(item.dataType),
          count: item._count.id,
        })),
      ];
    } else if (insightType === 'survey') {
      const res = await prisma.survey.findFirst({
        where: {
          id: insightId,
        },
        select: {
          payload: true,
        },
      });

      if (!res) {
        return [];
      }

      const payload: PrismaJson.SurveyPayload = res.payload;
      const payloadFields = payload.items.map((item: any) => ({
        name: item.name,
        type: 'string',
        count: 0,
      }));

      const builtinFields = insightsSurveyBuiltinFields.map((item) => ({
        name: item,
        type: 'string',
        count: 0,
      }));

      return [...payloadFields, ...builtinFields];
    } else if (insightType === 'warehouse') {
      const application = await findWarehouseApplication(
        input.workspaceId,
        insightId
      );
      let params: string[] = [];
      if (application?.type === 'wideTable') {
        params = await insightsWideTableWarehouseFilterParams(
          insightId,
          input.workspaceId
        );
      } else {
        params = await insightsLongTableWarehouseFilterParams(
          insightId,
          input.workspaceId
        );
      }

      return params.map((item) => ({
        name: item,
        type: 'string',
        count: 0,
      }));
    }

    return [];
  }),
  filterParamValues: insightTargetProcedure
    .input(
      z.object({
        paramName: z.string(),
        source: z.enum(['builtin', 'custom']).optional(),
      })
    )
    .query(async ({ input }) => {
      const { insightId, insightType, paramName } = input;

      if (insightType === 'website') {
        const builtin = insightsWebsiteBuiltinFields.find(
          (field) => input.source === 'builtin' && field.name === paramName
        );
        if (builtin) {
          const args = {
            select: { [builtin.column]: true },
            orderBy: { createdAt: 'desc' as const },
            take: 100,
          };
          const rows =
            builtin.table === 'WebsiteSession'
              ? await prisma.websiteSession.findMany({
                  ...args,
                  where: {
                    websiteId: insightId,
                    website: { workspaceId: input.workspaceId },
                  },
                })
              : await prisma.websiteEvent.findMany({
                  ...args,
                  where: {
                    websiteId: insightId,
                    session: { website: { workspaceId: input.workspaceId } },
                  },
                });
          return uniq(
            rows
              .map((row) => (row as Record<string, unknown>)[builtin.column])
              .filter(
                (value): value is string =>
                  typeof value === 'string' && value !== ''
              )
          ).slice(0, 10);
        }
        const res = await prisma.websiteEventData.findMany({
          where: {
            websiteId: insightId,
            eventKey: paramName,
          },
          select: {
            stringValue: true,
            numberValue: true,
            dateValue: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        });

        return uniq(
          res.map((item) => {
            if (item.stringValue) {
              return item.stringValue;
            }

            if (item.numberValue) {
              return item.numberValue.toString();
            }

            if (item.dateValue) {
              return item.dateValue.toISOString();
            }

            return null;
          })
        ).slice(0, 10);
      } else if (insightType === 'survey') {
        if (insightsSurveyBuiltinFields.includes(paramName)) {
          // its buitin fields which should fetch from surveyResult fields.
          const results = await prisma.surveyResult.findMany({
            where: {
              surveyId: insightId,
              [paramName]: {
                not: null,
              },
            },
            select: {
              [paramName]: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 100,
          });

          return uniq(results.map((item) => item[paramName])).slice(0, 10);
        } else {
          const results = await prisma.surveyResult.findMany({
            where: {
              surveyId: insightId,
            },
            select: {
              payload: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 100,
          });

          if (!results.length) {
            return [];
          }

          // Extract unique values for the specific paramName
          const uniqueValues = new Set<string>();

          results.forEach((result) => {
            const payload: any = result.payload;
            if (payload && payload[paramName] !== undefined) {
              const value = payload[paramName];
              // Convert value to string for consistent handling
              if (value !== null && value !== undefined) {
                uniqueValues.add(String(value));
              }
            }
          });

          return Array.from(uniqueValues).slice(0, 10);
        }
      }

      return [];
    }),
  warehouseApplications: workspaceProcedure.query(async ({ input }) => {
    const applications = await getWarehouseApplications(input.workspaceId);
    return applications.map((a) => a.name);
  }),
  warehouseApplicationsWideTable: workspaceProcedure.query(
    async ({ input }) => {
      const applications = await getWarehouseApplications(input.workspaceId);
      return applications
        .filter((a) => a.type === 'wideTable')
        .map((a) => a.name);
    }
  ),
  cohorts: insightCohortsRouter,
  warehouse: warehouseRouter,
});
