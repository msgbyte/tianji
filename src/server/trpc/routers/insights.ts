import { router, workspaceProcedure } from '../trpc.js';
import { insightsQuerySchema } from '../../utils/schema.js';
import { z } from 'zod';
import { prisma } from '../../model/_client.js';
import { EVENT_TYPE } from '../../utils/const.js';
import { stringifyDateType } from '../../utils/common.js';
import { queryInsight } from '../../model/insights/index.js';

export const insightsRouter = router({
  query: workspaceProcedure
    .input(insightsQuerySchema)
    .query(async ({ input, ctx }) => {
      return queryInsight(input, {
        timezone: ctx.timezone,
      });
    }),
  events: workspaceProcedure
    .input(
      z.object({
        insightId: z.string(),
        insightType: z.enum(['website', 'survey']),
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
              : item.eventName ?? '<null>',
          count: item._count.id,
        }));
      }

      if (insightType === 'survey') {
        return [];
      }

      return [];
    }),
  filterParams: workspaceProcedure
    .input(
      z.object({
        insightId: z.string(),
        insightType: z.enum(['website', 'survey']),
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

        return payload.items.map((item: any) => ({
          name: item.name,
          type: 'string',
          count: 0,
        }));
      }

      return [];
    }),
});
