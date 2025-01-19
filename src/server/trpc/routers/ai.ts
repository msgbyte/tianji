import { z } from 'zod';
import { router, workspaceProcedure } from '../trpc.js';
import { getOpenAIClient } from '../../model/openai.js';
import { env } from '../../utils/env.js';

export const aiRouter = router({
  ask: workspaceProcedure
    .input(
      z.object({
        question: z.string(),
      })
    )
    .query(async function* ({ input }) {
      const { question } = input;

      if (env.isProd) {
        return '';
      }

      if (!env.openai.enable) {
        return '';
      }

      const stream = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: question }],
        stream: true,
      });
      for await (const chunk of stream) {
        yield {
          finish_reason: chunk.choices[0].finish_reason,
          content: chunk.choices[0].delta.content ?? '',
        };
      }
    }),
});
