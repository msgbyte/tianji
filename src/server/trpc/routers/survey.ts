import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import {
  SurveyModelSchema,
  SurveyResultModelSchema,
} from '../../prisma/zod/index.js';
import { OpenApiMeta } from 'trpc-openapi';
import { hashUuid } from '../../utils/common.js';
import { getRequestInfo } from '../../utils/detect.js';
import { SurveyPayloadSchema } from '../../prisma/zod/schemas/index.js';
import { buildCursorResponseSchema } from '../../utils/schema.js';
import { fetchDataByCursor } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';

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
        path: '/{surveyId}',
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

      await prisma.surveyResult.create({
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

      return 'success';
    }),
  create: workspaceOwnerProcedure
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
      })
    )
    .output(SurveyModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, name, payload } = input;

      const res = await prisma.survey.create({
        data: {
          workspaceId,
          name,
          payload,
        },
      });

      return res;
    }),
  update: workspaceOwnerProcedure
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
      })
    )
    .output(SurveyModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, surveyId, name, payload } = input;

      const res = await prisma.survey.update({
        where: {
          workspaceId,
          id: surveyId,
        },
        data: {
          name,
          payload,
        },
      });

      return res;
    }),
  delete: workspaceOwnerProcedure
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
      })
    )
    .output(buildCursorResponseSchema(SurveyResultModelSchema))
    .query(async ({ input }) => {
      const limit = input.limit;
      const { cursor, surveyId } = input;

      const where: Prisma.SurveyResultWhereInput = {
        surveyId,
      };

      if (input.startAt && input.endAt) {
        where.createdAt = {
          gte: new Date(input.startAt),
          lte: new Date(input.endAt),
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
