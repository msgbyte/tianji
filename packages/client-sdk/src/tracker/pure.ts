/**
 * Pure Website Tracking SDK for Tianji
 * Simple event tracking without DOM manipulation or auto-tracking
 */

import { IdentifyPayload } from '../types';

/**
 * Website event payload interface
 */
export interface WebsiteEventPayload {
  /**
   * Website identifier (required)
   */
  website: string;
  /**
   * Current hostname
   */
  hostname?: string;
  /**
   * Screen resolution
   */
  screen?: string;
  /**
   * Browser language
   */
  language?: string;
  /**
   * Page title
   */
  title?: string;
  /**
   * Current URL
   */
  url?: string;
  /**
   * Referrer URL
   */
  referrer?: string;
  /**
   * Event name (for custom events)
   */
  name?: string;
  /**
   * Event data
   */
  data?: Record<string, any>;
}

/**
 * Website identify payload interface
 */
export interface WebsiteIdentifyPayload extends WebsiteEventPayload {
  /**
   * User identification data (required for identify)
   */
  data: Record<string, any>;
}

/**
 * Options for website tracking
 */
export interface WebsiteTrackingOptions {
  /**
   * Your Tianji server URL
   * @example https://tianji.example.com
   */
  serverUrl: string;
  /**
   * Website identifier
   */
  websiteId: string;
}

let options: WebsiteTrackingOptions | undefined;

/**
 * Initialize website tracking
 */
export function initWebsiteTracking(_options: WebsiteTrackingOptions) {
  options = _options;
}

/**
 * Get basic browser information if available
 */
function getBrowserInfo(): Partial<WebsiteEventPayload> {
  if (typeof window === 'undefined') {
    return {};
  }

  const {
    screen: { width, height },
    navigator: { language },
    location: { hostname, pathname, search },
    document: { title, referrer },
  } = window;

  return {
    hostname,
    screen: `${width}x${height}`,
    language,
    title,
    url: `${pathname}${search}`,
    referrer: referrer || undefined,
  };
}

/**
 * Send website page view event to Tianji server
 */
export async function trackPageView(
  url?: string,
  title?: string
): Promise<void> {
  if (!options) {
    console.warn('Website tracking is not initialized');
    return;
  }

  const browserInfo = getBrowserInfo();
  const payload: WebsiteEventPayload = {
    website: options.websiteId,
    ...browserInfo,
    ...(url && { url }),
    ...(title && { title }),
  };

  sendWebsiteRequest(options.serverUrl, 'event', payload);
}

/**
 * Send custom website event to Tianji server
 *
 * @param eventName - Name of the event
 * @param eventData - Event data
 */
export async function reportWebsiteEvent(
  eventName: string,
  eventData: Record<string, any> = {}
): Promise<void> {
  if (!options) {
    console.warn('Website tracking is not initialized');
    return;
  }

  const browserInfo = getBrowserInfo();
  const payload: WebsiteEventPayload = {
    website: options.websiteId,
    ...browserInfo,
    name: eventName,
    data: eventData,
  };

  sendWebsiteRequest(options.serverUrl, 'event', payload);
}

/**
 * Identify user for website tracking
 *
 * @param userData - User identification data
 */
export async function identifyWebsiteUser(
  userInfo: IdentifyPayload
): Promise<void> {
  if (!options) {
    console.warn('Website tracking is not initialized');
    return;
  }

  if (!userInfo || Object.keys(userInfo).length === 0) {
    console.warn('User data is required for identification');
    return;
  }

  const browserInfo = getBrowserInfo();
  const payload: WebsiteIdentifyPayload = {
    website: options.websiteId,
    ...browserInfo,
    data: userInfo,
  };

  sendWebsiteRequest(options.serverUrl, 'identify', payload);
}

/**
 * Send request to Tianji website API
 *
 * @param serverUrl - Tianji server URL
 * @param type - Request type ('event' or 'identify')
 * @param payload - Request payload
 */
async function sendWebsiteRequest(
  serverUrl: string,
  type: 'event' | 'identify',
  payload: WebsiteEventPayload | WebsiteIdentifyPayload
): Promise<void> {
  try {
    const response = await fetch(`${serverUrl}/api/website/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send website ${type}: ${errorText}`);
    }
  } catch (error) {
    console.error(`Error sending website ${type}:`, error);
    return; // As event tracking SDK, should not throw error which maybe cause crash
  }
}
