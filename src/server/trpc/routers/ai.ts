import { z } from 'zod';
import { router, workspaceProcedure } from '../trpc.js';
import {
  calcOpenAIToken,
  modelName,
  getOpenAIClient,
  requestOpenAI,
  groupByTokenSize,
  modelMaxToken,
} from '../../model/openai.js';
import { env } from '../../utils/env.js';
import {
  buildSurveyClassifyPrompt,
  getSurveyPrompt,
} from '../../model/prompt/survey.js';
// @ts-ignore
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { get, groupBy, invertBy, sum, uniq, values } from 'lodash-es';
import { createAuditLog } from '../../model/auditLog.js';
import {
  checkCredit,
  costCredit,
  tokenCreditFactor,
} from '../../model/billing/credit.js';
import { prisma } from '../../model/_client.js';
import dayjs from 'dayjs';
import pMap from 'p-map';
import { Prisma } from '@prisma/client';

export const aiRouter = router({
  ask: workspaceProcedure
    .input(
      z.object({
        question: z.string(),
        context: z
          .union([
            z.object({
              type: z.literal('survey'),
              surveyId: z.string(),
            }),
            z.object({
              type: z.literal('unknown'),
            }),
          ])
          .optional(),
      })
    )
    .query(async function* ({ input, ctx }) {
      const { workspaceId, question, context } = input;
      const userId = ctx.user.id;

      if (env.isProd) {
        return '';
      }

      if (!env.openai.enable) {
        return '';
      }

      await checkCredit(workspaceId);

      let promptMessages: ChatCompletionMessageParam[] = [];
      if (context?.type === 'survey') {
        promptMessages = await getSurveyPrompt(context.surveyId);
      }

      const messages: ChatCompletionMessageParam[] = [
        ...promptMessages,
        { role: 'user', content: question },
      ];

      const inputToken = sum(
        messages.map((m) => calcOpenAIToken(String(m.content)))
      );

      const stream = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages,
        stream: true,
      });
      let result = '';
      for await (const chunk of stream) {
        result += chunk.choices[0].delta.content ?? '';

        yield {
          finish_reason: chunk.choices[0].finish_reason,
          content: chunk.choices[0].delta.content ?? '',
        };
      }

      const outputToken = calcOpenAIToken(result);

      const credit = tokenCreditFactor * (inputToken + outputToken);

      costCredit(workspaceId, credit, 'ai', {
        inputToken,
        outputToken,
        context,
        userId,
      });
      createAuditLog({
        workspaceId,
        content: JSON.stringify({
          type: 'ai',
          context,
          credit,
          inputToken,
          outputToken,
        }),
      });
    }),
  classifySurvey: workspaceProcedure
    .input(
      z.object({
        surveyId: z.string(),
        startAt: z.number(),
        endAt: z.number(),
        runStrategy: z.enum(['skipExist', 'skipInSuggest', 'rebuildAll']),
        languageStrategy: z.enum(['default', 'user']).default('default'),
        payloadContentField: z.string(),
        suggestionCategory: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        workspaceId,
        surveyId,
        startAt,
        endAt,
        runStrategy,
        languageStrategy,
        payloadContentField,
        suggestionCategory,
      } = input;
      const { language } = ctx;

      const where: Prisma.SurveyResultWhereInput = {
        surveyId,
        createdAt: {
          gt: dayjs(startAt).toDate(),
          lt: dayjs(endAt).toDate(),
        },
      };

      if (runStrategy === 'skipExist') {
        where.aiCategory = null;
      } else if (runStrategy === 'skipInSuggest') {
        where.aiCategory = {
          notIn: suggestionCategory,
        };
      }

      const data = await prisma.surveyResult.findMany({
        where,
        select: {
          id: true,
          payload: true,
        },
      });

      if (data.length === 0) {
        return {
          analysisCount: 0,
          processedCount: 0,
          categorys: [],
          effectCount: 0,
        };
      }

      let categoryJson = {};
      let currentSuggestionCategory = uniq([...suggestionCategory]);
      const groups = groupByTokenSize(
        data.map((item) => ({
          id: item.id,
          content: item.payload[payloadContentField] ?? '',
        })),
        (item) => item.content,
        Math.ceil(modelMaxToken / 3) -
          calcOpenAIToken(JSON.stringify(currentSuggestionCategory))
      );
      for (const group of groups) {
        const prompt = buildSurveyClassifyPrompt(
          group,
          currentSuggestionCategory,
          languageStrategy === 'user' ? language : 'en'
        );

        const res = await requestOpenAI(
          workspaceId,
          prompt,
          'Please help me generate data.',
          {
            response_format: { type: 'json_object' },
          }
        );

        const json = JSON.parse(res);

        if (json.error) {
          throw new Error(String(json.error));
        }

        currentSuggestionCategory = uniq([
          ...currentSuggestionCategory,
          ...values(json),
        ]);
        categoryJson = {
          ...categoryJson,
          ...json,
        };
      }

      const categorys: Record<string, string[]> = invertBy(categoryJson);
      let effectCount = 0;
      await pMap(
        Object.keys(categorys),
        async (category) => {
          const ids = categorys[category];
          if (Array.isArray(ids) && ids.length > 0) {
            const res = await prisma.surveyResult.updateMany({
              where: {
                id: {
                  in: ids,
                },
              },
              data: {
                aiCategory: category,
              },
            });

            effectCount += res.count;
          }
        },
        {
          concurrency: 5,
        }
      );

      return {
        analysisCount: data.length,
        processedCount: Object.keys(categoryJson).length,
        categorys: Object.keys(categorys),
        effectCount,
      };
    }),
});
