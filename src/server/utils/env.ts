import { v1 as uuid } from 'uuid';
import md5 from 'md5';
import { compact } from 'lodash-es';

const jwtSecret =
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === 'replace-me-with-a-random-string'
    ? uuid()
    : process.env.JWT_SECRET;

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  jwtSecret,
  port: Number(process.env.PORT || 12345),
  auth: {
    provider: compact([
      !checkEnvTrusty(process.env.DISABLE_ACCOUNT) && 'account',
      !!process.env.EMAIL_SERVER && 'email',
      !!process.env.AUTH_GITHUB_ID && 'github',
      !!process.env.AUTH_GOOGLE_ID && 'google',
      !!process.env.AUTH_CUSTOM_ID && 'custom',
    ]),
    restrict: {
      email: process.env.AUTH_RESTRICT_EMAIL, // for example: @example.com
    },
    secret: process.env.AUTH_SECRET || md5(jwtSecret),
    email: {
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    },
    github: {
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    },
    google: {
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    },
    custom: {
      // Reference: https://authjs.dev/guides/configuring-oauth-providers
      name: process.env.AUTH_CUSTOM_NAME || 'Custom',
      type: process.env.AUTH_CUSTOM_TYPE || 'oidc', // or oauth
      issuer: process.env.AUTH_CUSTOM_ISSUR,
      clientId: process.env.AUTH_CUSTOM_ID,
      clientSecret: process.env.AUTH_CUSTOM_SECRET,
    },
  },
  allowRegister: checkEnvTrusty(process.env.ALLOW_REGISTER),
  allowOpenapi: checkEnvTrusty(process.env.ALLOW_OPENAPI ?? 'true'),
  websiteId: process.env.WEBSITE_ID,
  sandboxMemoryLimit: process.env.SANDBOX_MEMORY_LIMIT
    ? Number(process.env.SANDBOX_MEMORY_LIMIT)
    : 16, // unit: MB
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
