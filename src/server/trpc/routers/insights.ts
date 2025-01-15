import { router, workspaceProcedure } from '../trpc.js';
import { insightsQuerySchema } from '../../utils/schema.js';
import { insightsWebsite } from '../../model/website/insights.js';

export const insightsRouter = router({
  query: workspaceProcedure
    .input(insightsQuerySchema)
    .query(async ({ input, ctx }) => {
      return insightsWebsite(input, {
        timezone: ctx.timezone,
      });
    }),
});
