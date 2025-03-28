import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import {
  SurveyModelSchema,
  SurveyResultModelSchema,
} from '../../prisma/zod/index.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { hashUuid } from '../../utils/common.js';
import { getRequestInfo } from '../../utils/detect.js';
import { SurveyPayloadSchema } from '../../prisma/zod/schemas/index.js';
import { buildCursorResponseSchema } from '../../utils/schema.js';
import { fetchDataByCursor } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { createFeedEvent } from '../../model/feed/event.js';
import { formatString } from '../../utils/template.js';
import { logger } from '../../utils/logger.js';
import axios from 'axios';
import { getSurveyStats } from '../../model/survey.js';
import dayjs from 'dayjs';
import qs from 'qs';

export const surveyRouter = router({
  all: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/all',
      })
    )
    .output(z.array(SurveyModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const res = await prisma.survey.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return res;
    }),
  get: publicProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/{surveyId}/get',
      })
    )
    .input(
      z.object({
        workspaceId: z.string(),
        surveyId: z.string(),
      })
    )
    .output(SurveyModelSchema.nullable())
    .query(async ({ input }) => {
      const { workspaceId, surveyId } = input;

      const res = await prisma.survey.findUnique({
        where: {
          workspaceId,
          id: surveyId,
        },
      });

      return res;
    }),
  count: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/{surveyId}/count',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
      })
    )
    .output(z.number())
    .query(async ({ input }) => {
      const { surveyId } = input;

      const count = await prisma.surveyResult.count({
        where: {
          surveyId: surveyId,
        },
      });

      return count;
    }),
  allResultCount: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/allResultCount',
      })
    )
    .output(z.record(z.string(), z.number()))
    .query(async () => {
      const res = await prisma.surveyResult.groupBy({
        by: ['surveyId'],
        _count: true,
      });

      return res.reduce<Record<string, number>>((prev, item) => {
        if (item.surveyId) {
          prev[item.surveyId] = item._count;
        }

        return prev;
      }, {});
    }),
  submit: publicProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'POST',
        path: '/{surveyId}/submit',
      })
    )
    .input(
      z.object({
        workspaceId: z.string(),
        surveyId: z.string(),
        payload: z.record(z.string(), z.any()),
      })
    )
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      const { req } = ctx;
      const { workspaceId, surveyId, payload } = input;

      const {
        userAgent,
        browser,
        os,
        language,
        ip,
        country,
        subdivision1,
        subdivision2,
        city,
        longitude,
        latitude,
        accuracyRadius,
      } = await getRequestInfo(req);

      const sessionId = hashUuid(workspaceId, surveyId, ip, userAgent!);

      const result = await prisma.surveyResult.create({
        data: {
          surveyId,
          sessionId,
          payload,
          browser,
          os,
          language,
          ip,
          country,
          subdivision1,
          subdivision2,
          city,
          longitude,
          latitude,
          accuracyRadius,
        },
      });

      // async to push into feed channel
      prisma.survey
        .findFirst({
          where: {
            id: surveyId,
            workspaceId,
          },
        })
        .then((survey) => {
          if (
            survey &&
            Array.isArray(survey.feedChannelIds) &&
            survey.feedChannelIds.length > 0
          ) {
            const templateStr =
              survey.feedTemplate ||
              'survey {{_surveyName}} receive a new record.';

            survey.feedChannelIds.forEach(async (channelId) => {
              try {
                const surveyPayload = SurveyPayloadSchema.parse(survey.payload);

                await createFeedEvent(workspaceId, {
                  channelId: channelId,
                  eventName: 'receive',
                  eventContent: formatString(templateStr, {
                    _surveyName: survey.name,
                    ...Object.fromEntries(
                      surveyPayload.items.map((item) => [
                        item.name,
                        payload[item.name] ?? '',
                      ])
                    ),
                  }),
                  tags: [],
                  source: 'survey',
                  important: false,
                });
              } catch (err) {
                logger.error('[surveySubmitSendFeed]', err);
              }
            });
          }

          if (survey && survey.webhookUrl) {
            axios
              .post(survey.webhookUrl, {
                ...result,
              })
              .then(() => {
                logger.info(
                  `[surveySubmitWebhook] send webhooks to ${survey.webhookUrl} success!`
                );
              })
              .catch((err) => logger.error('[surveySubmitWebhook]', err));
          }
        });

      return 'success';
    }),
  create: workspaceAdminProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'POST',
        path: '/create',
      })
    )
    .input(
      z.object({
        name: z.string(),
        payload: SurveyPayloadSchema,
        feedChannelIds: z.array(z.string()),
        feedTemplate: z.string(),
        webhookUrl: z.string(),
      })
    )
    .output(SurveyModelSchema)
    .mutation(async ({ input }) => {
      const {
        workspaceId,
        name,
        payload,
        feedChannelIds,
        feedTemplate,
        webhookUrl,
      } = input;

      const res = await prisma.survey.create({
        data: {
          workspaceId,
          name,
          payload,
          feedChannelIds,
          feedTemplate,
          webhookUrl,
        },
      });

      return res;
    }),
  update: workspaceAdminProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'PATCH',
        path: '/{surveyId}/update',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
        name: z.string().optional(),
        payload: SurveyPayloadSchema.optional(),
        feedChannelIds: z.array(z.string()).optional(),
        feedTemplate: z.string().optional(),
        webhookUrl: z.string().optional(),
      })
    )
    .output(SurveyModelSchema)
    .mutation(async ({ input }) => {
      const {
        workspaceId,
        surveyId,
        name,
        payload,
        feedChannelIds,
        feedTemplate,
        webhookUrl,
      } = input;

      const res = await prisma.survey.update({
        where: {
          workspaceId,
          id: surveyId,
        },
        data: {
          name,
          payload,
          feedChannelIds,
          feedTemplate,
          webhookUrl,
        },
      });

      return res;
    }),
  delete: workspaceAdminProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'DELETE',
        path: '/{surveyId}/delete',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
      })
    )
    .output(SurveyModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, surveyId } = input;

      const res = await prisma.survey.delete({
        where: {
          id: surveyId,
          workspaceId,
        },
      });

      return res;
    }),
  resultList: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/{surveyId}/result/list',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
        limit: z.number().min(1).max(1000).default(50),
        cursor: z.string().optional(),
        startAt: z.number().optional(),
        endAt: z.number().optional(),
        filter: z.string().optional(),
      })
    )
    .output(buildCursorResponseSchema(SurveyResultModelSchema))
    .query(async ({ input }) => {
      const { cursor, surveyId, limit } = input;
      const filter = input.filter ? qs.parse(input.filter) : {};

      let where: Prisma.SurveyResultWhereInput = {
        surveyId,
      };

      if (input.startAt && input.endAt) {
        where.createdAt = {
          gte: new Date(input.startAt),
          lte: new Date(input.endAt),
        };
      }

      if (filter) {
        where = {
          ...where,
          ...filter,
        };
      }

      const { items, nextCursor } = await fetchDataByCursor(
        prisma.surveyResult,
        {
          where,
          limit,
          cursor,
        }
      );

      return {
        items,
        nextCursor,
      };
    }),
  stats: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/{surveyId}/stats',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
        startAt: z.number().optional(),
        endAt: z.number().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          count: z.number(),
        })
      )
    )
    .query(async ({ input, ctx }) => {
      const {
        surveyId,
        startAt = dayjs().subtract(7, 'week').startOf('day').toDate(),
        endAt = dayjs().endOf('day').toDate(),
      } = input;
      const timezone = ctx.timezone;

      const res = await getSurveyStats(
        surveyId,
        {
          startDate: new Date(startAt),
          endDate: new Date(endAt),
        },
        {
          timezone,
          unit: 'day',
        }
      );

      return res;
    }),
  aiCategoryList: workspaceProcedure
    .meta(
      buildSurveyOpenapi({
        method: 'GET',
        path: '/{surveyId}/aiCategoryList',
      })
    )
    .input(
      z.object({
        surveyId: z.string(),
      })
    )
    .output(
      z.array(
        z.object({
          name: z.string().nullable(),
          count: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const { surveyId } = input;

      const res = await prisma.surveyResult.groupBy({
        by: ['aiCategory'],
        where: {
          surveyId,
        },
        _count: true,
      });

      return res.map((item) => ({
        name: item.aiCategory,
        count: item._count,
      }));
    }),
});

function buildSurveyOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.SURVEY],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/survey${meta.path}`,
    },
  };
}
