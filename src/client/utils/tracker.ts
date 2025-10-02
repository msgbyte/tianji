import { getGlobalConfig } from '@/hooks/useConfig';
import { version } from '@/utils/env';
import {
  identifyWebsiteUser,
  initWebsiteTracking,
  trackPageView,
  reportWebsiteEvent,
} from 'tianji-client-react';

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
      identifyWebsiteUser({
        version: version,
      });
      initialized = true;
    }
  }
}

export function recordPageView(
  url: string = window.location.pathname,
  title: string = document.title
) {
  ensureInitialized();
  if (!initialized) {
    return;
  }

  trackPageView(url, title);
}

export function recordEvent(eventName: string, data?: Record<string, any>) {
  ensureInitialized();
  if (!initialized) {
    return;
  }

  reportWebsiteEvent(eventName, data);
}

export function identifyUser(data: Record<string, any>) {
  ensureInitialized();
  if (!initialized) {
    return;
  }

  identifyWebsiteUser(data);
}
