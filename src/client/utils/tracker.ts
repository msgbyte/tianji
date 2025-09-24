import { getGlobalConfig } from '@/hooks/useConfig';
import { initWebsiteTracking, reportWebsiteEvent } from 'tianji-client-sdk';

let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    const config = getGlobalConfig();
    if (
      config.observability.tianji.baseUrl &&
      config.observability.tianji.websiteId
    ) {
      initWebsiteTracking({
        serverUrl: config.observability.tianji.baseUrl,
        websiteId: config.observability.tianji.websiteId,
      });
      initialized = true;
    }
  }
}

export function recordEvent(eventName: string, data?: Record<string, any>) {
  ensureInitialized();
  if (!initialized) {
    return;
  }

  reportWebsiteEvent(eventName, data);
}
