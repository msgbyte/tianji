export const env = {
  allowRegister: checkEnvTrusty(process.env.ALLOW_REGISTER),
  allowOpenapi: checkEnvTrusty(process.env.ALLOW_OPENAPI),
  websiteId: process.env.WEBSITE_ID,
  sandboxMemoryLimit: process.env.SANDBOX_MEMORY_LIMIT
    ? Number(process.env.SANDBOX_MEMORY_LIMIT)
    : 16, // unit: MB
  dbDebug: checkEnvTrusty(process.env.DB_DEBUG),
};

export function checkEnvTrusty(env: string | undefined): boolean {
  return env === '1' || env === 'true';
}
