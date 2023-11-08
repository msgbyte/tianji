export const env = {
  allowRegister: checkEnvTrusty(process.env.ALLOW_REGISTER),
  allowOpenapi: checkEnvTrusty(process.env.ALLOW_OPENAPI),
  websiteId: process.env.WEBSITE_ID,
  serverUrl: process.env.SERVER_URL, // example: https://tianji.example.com
};

export function checkEnvTrusty(env: string | undefined): boolean {
  return env === '1' || env === 'true';
}
