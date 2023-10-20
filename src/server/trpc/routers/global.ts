import { publicProcedure, router } from '../trpc';

export const globalRouter = router({
  config: publicProcedure.query(async ({ input }) => {
    return {
      allowRegister: checkEnvTrusty(process.env.ALLOW_REGISTER),
      websiteId: process.env.WEBSITE_ID,
    };
  }),
});

function checkEnvTrusty(env: string | undefined): boolean {
  return env === '1' || env === 'true';
}
