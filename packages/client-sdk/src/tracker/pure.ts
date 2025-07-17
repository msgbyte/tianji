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
 * Batch request item interface
 */
export interface BatchRequestItem {
  type: 'event' | 'identify';
  payload: WebsiteEventPayload | WebsiteIdentifyPayload;
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
  /**
   * Batch delay in milliseconds (optional, defaults to 200ms)
   */
  batchDelay?: number;
  /**
   * Disable batch mode and send requests immediately (optional, defaults to false)
   */
  disableBatch?: boolean;
}

let options: WebsiteTrackingOptions | undefined;
let batchQueue: BatchRequestItem[] = [];
let batchTimer: NodeJS.Timeout | number | null = null;

/**
 * Initialize website tracking
 */
export function initWebsiteTracking(_options: WebsiteTrackingOptions) {
  options = _options;

  // Clear any existing batch queue and timer when reinitializing
  clearBatchQueue();
}

/**
 * Clear batch queue and timer
 */
function clearBatchQueue() {
  batchQueue = [];
  if (batchTimer) {
    clearTimeout(batchTimer as any);
    batchTimer = null;
  }
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
 * Send website request with automatic batching
 * Events are automatically queued and sent together at fixed intervals (throttling)
 * If queue reaches 100 events, it will be sent immediately
 *
 * @param serverUrl - Tianji server URL
 * @param type - Request type ('event' or 'identify')
 * @param payload - Request payload
 */
function sendWebsiteRequest(
  serverUrl: string,
  type: 'event' | 'identify',
  payload: WebsiteEventPayload | WebsiteIdentifyPayload
): void {
  if (options?.disableBatch) {
    // Send immediately if batch mode is disabled
    sendSingleRequest(serverUrl, type, payload);
    return;
  }

  // Add to batch queue
  batchQueue.push({ type, payload });

  // Send immediately if queue reaches the limit (100 events)
  if (batchQueue.length >= 100) {
    flushBatchQueue();
    return;
  }

  // Start timer only if not already running (throttling behavior)
  if (!batchTimer) {
    const delay = options?.batchDelay || 200;
    batchTimer = setTimeout(() => {
      sendBatchRequest(serverUrl);
    }, delay);
  }
}

/**
 * Send single request to Tianji website API (fallback when batch is disabled)
 *
 * @param serverUrl - Tianji server URL
 * @param type - Request type ('event' or 'identify')
 * @param payload - Request payload
 */
async function sendSingleRequest(
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

/**
 * Send batch request to Tianji website API
 *
 * @param serverUrl - Tianji server URL
 */
async function sendBatchRequest(serverUrl: string): Promise<void> {
  if (batchQueue.length === 0) {
    return;
  }

  const requestData = [...batchQueue];
  batchQueue = [];
  batchTimer = null;

  try {
    const response = await fetch(`${serverUrl}/api/website/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: requestData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send batch request: ${errorText}`);
    }
  } catch (error) {
    console.error('Error sending batch request:', error);
    return; // As event tracking SDK, should not throw error which maybe cause crash
  }
}

/**
 * Flush batch queue manually (send all pending requests immediately)
 * Useful for ensuring events are sent before page unload
 */
export async function flushBatchQueue(): Promise<void> {
  if (batchTimer) {
    clearTimeout(batchTimer as any);
    batchTimer = null;
  }

  if (batchQueue.length > 0 && options) {
    await sendBatchRequest(options.serverUrl);
  }
}
