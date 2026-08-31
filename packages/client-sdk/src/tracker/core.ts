/**
 * Core tracker utilities shared between IIFE and module versions
 */

import { BatchManager, BatchItem } from '../utils/batch-manager';

export const DEFAULT_WEBSITE_BATCH_DELAY = 1_000;

export interface WebsiteEventPayload {
  website: string;
  distinctId?: string;
  hostname?: string;
  screen?: string;
  language?: string;
  title?: string;
  url?: string;
  referrer?: string;
  name?: string;
  data?: Record<string, any>;
}

export interface TrackerCoreOptions {
  serverUrl: string;
  websiteId: string;
  batchDelay?: number;
  disableBatch?: boolean;
}

export function getWebsiteDistinctId(data: Record<string, any>) {
  for (const value of [data.id, data.userId]) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

/**
 * Get basic browser information
 */
export function getBrowserInfo(): Partial<WebsiteEventPayload> {
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
 * Create a tracker core instance with batch support
 */
export function createTrackerCore(options: TrackerCoreOptions) {
  const {
    serverUrl,
    websiteId,
    batchDelay = DEFAULT_WEBSITE_BATCH_DELAY,
    disableBatch = false,
  } = options;
  const endpoint = `${serverUrl}/api/website/send`;
  const batchEndpoint = `${serverUrl}/api/website/batch`;
  let distinctId: string | undefined;

  const sendSingle = async (
    type: 'event' | 'identify',
    payload: WebsiteEventPayload
  ): Promise<void> => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
    } catch (e) {
      // Silent fail for tracking
    }
  };

  const sendBatch = async (items: BatchItem[]): Promise<void> => {
    try {
      await fetch(batchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: items }),
      });
    } catch (e) {
      // Silent fail for tracking
    }
  };

  const batchManager = new BatchManager<WebsiteEventPayload>({
    batchDelay,
    disableBatch,
    onBatchSend: sendBatch,
    onSingleSend: (item) =>
      sendSingle(item.type as 'event' | 'identify', item.payload),
  });

  const getPayload = (
    overrides?: Partial<WebsiteEventPayload>
  ): WebsiteEventPayload => ({
    website: websiteId,
    ...getBrowserInfo(),
    ...(distinctId ? { distinctId } : {}),
    ...overrides,
  });

  return {
    track: (
      eventNameOrPayload?: string | WebsiteEventPayload,
      eventData?: Record<string, any>
    ) => {
      let payload: WebsiteEventPayload;
      if (
        typeof eventNameOrPayload === 'object' &&
        eventNameOrPayload !== null
      ) {
        payload = getPayload(eventNameOrPayload);
      } else {
        payload = getPayload(
          eventNameOrPayload
            ? { name: eventNameOrPayload, data: eventData }
            : undefined
        );
      }
      batchManager.add('event', payload);
    },

    identify: (data: Record<string, any>) => {
      distinctId = getWebsiteDistinctId(data);

      const payload = getPayload({ data });
      batchManager.add('identify', payload);
    },

    flush: () => batchManager.flush(),

    getPayload,
  };
}

export { BatchManager };
export type { BatchItem };
