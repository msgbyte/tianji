import { OpenAPI } from './open/client';

export function initOpenapiSDK(baseUrl: string) {
  OpenAPI.BASE = baseUrl.endsWith('/open') ? baseUrl : `${baseUrl}/open`;
}
