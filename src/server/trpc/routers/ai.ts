import { z } from 'zod';
import { router, workspaceProcedure } from '../trpc.js';
import {
  calcOpenAIToken,
  modelName,
  openaiClient,
} from '../../model/openai.js';
import { env } from '../../utils/env.js';
import { getSurveyPrompt } from '../../model/prompt/survey.js';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { sum } from 'lodash-es';
import { createAuditLog } from '../../model/auditLog.js';
import { tokenCreditFactor } from '../../model/billing/credit.js';

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
    .query(async function* ({ input }) {
      const { workspaceId, question, context } = input;

      if (env.isProd) {
        return '';
      }

      if (!env.openai.enable) {
        return '';
      }

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

      const stream = await openaiClient.chat.completions.create({
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

      const credit = tokenCreditFactor * (inputToken + outputToken); // TODO

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
});
