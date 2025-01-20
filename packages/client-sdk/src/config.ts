import { OpenAPI } from './open/client';

interface OpenapiSDKOptions {
  header?: Record<string, string>;
}
export function initOpenapiSDK(baseUrl: string, options?: OpenapiSDKOptions) {
  OpenAPI.BASE = baseUrl.endsWith('/open') ? baseUrl : `${baseUrl}/open`;

  if (options?.header) {
    OpenAPI.HEADERS = options.header;
  }
}
