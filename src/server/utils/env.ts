export const env = {
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 12345),
  allowRegister: checkEnvTrusty(process.env.ALLOW_REGISTER),
  allowOpenapi: checkEnvTrusty(process.env.ALLOW_OPENAPI),
  websiteId: process.env.WEBSITE_ID,
  sandboxMemoryLimit: process.env.SANDBOX_MEMORY_LIMIT
    ? Number(process.env.SANDBOX_MEMORY_LIMIT)
    : 16, // unit: MB
  dbDebug: checkEnvTrusty(process.env.DB_DEBUG),
  amapToken: process.env.AMAP_TOKEN,
  mapboxToken: process.env.MAPBOX_TOKEN,
  alphaMode: checkEnvTrusty(process.env.ALPHA_MODE),
  disableAnonymousTelemetry: checkEnvTrusty(
    process.env.DISABLE_ANONYMOUS_TELEMETRY
  ),
  customTrackerScriptName: process.env.CUSTOM_TRACKER_SCRIPT_NAME,
  disableAutoClear: checkEnvTrusty(process.env.DISABLE_AUTO_CLEAR), // disable auto clear old data cronjob
};

export function checkEnvTrusty(env: string | undefined): boolean {
  return env === '1' || env === 'true';
}
