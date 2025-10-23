import loadScript from 'load-script';
import { IdentifyPayload } from '../types';
import {
  identifyWebsiteUser,
  initWebsiteTracking,
  trackPageView,
  reportWebsiteEvent,
} from './pure';

export {
  identifyWebsiteUser,
  initWebsiteTracking,
  trackPageView,
  reportWebsiteEvent,
};

interface InjectTrackerOptions {
  /**
   * your tianji application website
   * @example
   * https://tianji.example.com
   */
  url: string;
  /**
   * Website id, you can get it from your tianji dashboard
   */
  websiteId: string;
  /**
   * If you modify your tracker name with
   */
  customTrackerName?: string;

  /**
   * is auto track route change and dom
   */
  autoTrack?: boolean;

  /**
   * Whitelist domains, default will report all website
   * @example
   * example.com, www.example.com
   */
  domains?: string[];

  disableTrack?: boolean;
}

export async function initTianjiTracker(options: InjectTrackerOptions) {
  if (typeof window === 'undefined') {
    console.warn('This function should be called in browser environment!');
    return;
  }

  const trackerName = options.customTrackerName ?? 'tracker.js';

  const attrs: Record<string, string> = {
    'data-website-id': options.websiteId,
  };

  initWebsiteTracking({
    serverUrl: options.url,
    websiteId: options.websiteId,
  });

  const tianji = (window as any).tianji;
  if (tianji) {
    // if tianji is already initialized, skip
    console.warn('Tianji is already initialized, skipping initialization.');
    return;
  }

  if (options.autoTrack === false) {
    attrs['data-auto-track'] = 'false';
  }

  if (Array.isArray(options.domains)) {
    attrs['data-domains'] = options.domains.join(',');
  }

  if (options.disableTrack === true) {
    attrs['data-do-not-track'] = 'true';
  }

  return new Promise<HTMLScriptElement>((resolve, reject) => {
    loadScript(
      `${options.url}/${trackerName}`,
      {
        async: true,
        attrs,
      },
      (err, script) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(script);
      }
    );
  });
}

/**
 * @deprecated use reportWebsiteEvent instead
 */
export function reportEvent(eventName: string, data: Record<string, any> = {}) {
  if (typeof window === 'undefined') {
    console.warn('This function should be called in browser environment!');
    return;
  }

  const tianji = (window as any).tianji;
  if (tianji) {
    if (!tianji.track) {
      console.warn('tianji.track is not ready');
      return;
    }

    tianji.track(eventName, data);
  } else {
    reportWebsiteEvent(eventName, data);
  }
}

/**
 * @deprecated use identifyWebsiteUser instead
 */
export function identify(data: IdentifyPayload) {
  if (typeof window === 'undefined') {
    console.warn('This function should be called in browser environment!');
    return;
  }

  const tianji = (window as any).tianji;
  if (tianji) {
    if (!tianji.identify) {
      console.warn('tianji.identify is not ready');
      return;
    }

    tianji.identify(data);
  } else {
    identifyWebsiteUser(data);
  }
}
