import { OpenAPI } from './open/client';

interface OpenapiSDKOptions {
  header?: Record<string, string>;
  apiKey?: string;
}
export function initOpenapiSDK(baseUrl: string, options?: OpenapiSDKOptions) {
  OpenAPI.BASE = baseUrl.endsWith('/open') ? baseUrl : `${baseUrl}/open`;

  if (options?.apiKey) {
    OpenAPI.TOKEN = options.apiKey;
  }

  if (options?.header) {
    OpenAPI.HEADERS = options.header;
  }
}
