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
import { insightsSurveyBuiltinFields } from '../../../model/insights/utils.js';
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

export const insightsRouter = router({
  query: workspaceProcedure
    .input(insightsQuerySchema)
    .query(async ({ input, ctx }) => {
      return queryInsight(input, {
        timezone: ctx.timezone,
      });
    }),
  queryEvents: workspaceProcedure
    .input(insightsQueryEventsSchema)
    .query(async ({ input, ctx }) => {
      return queryEvents(input, {
        timezone: ctx.timezone,
      });
    }),
  eventNames: workspaceProcedure
    .input(
      z.object({
        insightId: z.string(),
        insightType: insightTypeSchema,
      })
    )
    .query(async ({ input }) => {
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
        const application = findWarehouseApplication(insightId);
        let events: string[] = [];
        console.log('application', application);
        if (application?.type === 'wideTable') {
          events = await insightsWideTableWarehouseEvents(insightId);
        } else {
          events = await insightsLongTableWarehouseEvents(insightId);
        }

        return events.map((item) => ({
          name: item,
          count: 0,
        }));
      }

      return [];
    }),
  filterParams: workspaceProcedure
    .input(
      z.object({
        insightId: z.string(),
        insightType: insightTypeSchema,
      })
    )
    .query(async ({ input }) => {
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

        return res.map((item) => ({
          name: item.eventKey,
          type: stringifyDateType(item.dataType),
          count: item._count.id,
        }));
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
        const application = findWarehouseApplication(insightId);
        let params: string[] = [];
        if (application?.type === 'wideTable') {
          params = await insightsWideTableWarehouseFilterParams(insightId);
        } else {
          params = await insightsLongTableWarehouseFilterParams(insightId);
        }

        return params.map((item) => ({
          name: item,
          type: 'string',
          count: 0,
        }));
      }

      return [];
    }),
  filterParamValues: workspaceProcedure
    .input(
      z.object({
        insightId: z.string(),
        insightType: insightTypeSchema,
        paramName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { insightId, insightType, paramName } = input;

      if (insightType === 'website') {
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
    if (input.workspaceId !== INIT_WORKSPACE_ID) {
      return [];
    }

    return getWarehouseApplications().map((a) => a.name);
  }),
  warehouseApplicationsWideTable: workspaceProcedure.query(
    async ({ input }) => {
      if (input.workspaceId !== INIT_WORKSPACE_ID) {
        return [];
      }

      return getWarehouseApplications()
        .filter((a) => a.type === 'wideTable')
        .map((a) => a.name);
    }
  ),
  cohorts: insightCohortsRouter,
});
