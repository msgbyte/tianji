/**
 * Client SDK for Tianji Application API
 */

import { IdentifyPayload } from './types';
import { BatchManager, BatchItem } from './utils/batch-manager';

/**
 * Application event payload interface
 */
export interface ApplicationEventPayload {
  /**
   * Language information (max 35 chars)
   */
  language?: string;
  /**
   * Operating system information (max 20 chars)
   */
  os?: string;
  /**
   * URL information (max 500 chars)
   */
  url?: string;
  /**
   * Application identifier (required)
   */
  application: string;
  /**
   * Event name (max 50 chars)
   */
  name?: string;
  /**
   * Application data object
   */
  data?: Record<string, any>;

  /**
   * Screen Name
   */
  screen?: string;

  /**
   * Screen Params
   */
  params?: Record<string, any>;
}

/**
 * Application identify payload interface
 */
export interface ApplicationIdentifyPayload extends ApplicationEventPayload {
  /**
   * User identification data (required for identify)
   */
  data: Record<string, any>;
}

/**
 * Batch request item interface
 */
export interface ApplicationBatchRequestItem
  extends BatchItem<ApplicationEventPayload | ApplicationIdentifyPayload> {
  type: 'event' | 'identify';
  payload: ApplicationEventPayload | ApplicationIdentifyPayload;
}

/**
 * Options for application tracking
 */
export interface ApplicationTrackingOptions {
  /**
   * Your Tianji server URL
   * @example https://tianji.example.com
   */
  serverUrl: string;
  /**
   * Application identifier
   */
  applicationId: string;
  /**
   * Batch delay in milliseconds (optional, defaults to 200ms)
   */
  batchDelay?: number;
  /**
   * Disable batch mode and send requests immediately (optional, defaults to false)
   */
  disableBatch?: boolean;
}

let options: ApplicationTrackingOptions | undefined;
let batchManager: BatchManager<
  ApplicationEventPayload | ApplicationIdentifyPayload
> | null = null;

export function initApplication(_options: ApplicationTrackingOptions) {
  options = _options;

  // Initialize batch manager
  batchManager = new BatchManager({
    batchDelay: _options.batchDelay,
    disableBatch: _options.disableBatch,
    onBatchSend: async (items) => {
      await sendBatchRequest(_options.serverUrl, items);
    },
    onSingleSend: async (item) => {
      await sendSingleRequest(
        _options.serverUrl,
        item.type as 'event' | 'identify',
        item.payload
      );
    },
  });
}

let currentScreenName: string | undefined = undefined;
let currentScreenParams: Record<string, any> | undefined = undefined;
/**
 * Update current application screen
 */
export function updateCurrentApplicationScreen(
  name: string,
  params: Record<string, any>
) {
  currentScreenName = name;
  currentScreenParams = params;
}

/**
 * Send application screen view event to Tianji server
 */
export async function reportApplicationScreenView(
  screenName?: string,
  screenParams?: Record<string, any>
): Promise<void> {
  if (!options) {
    console.warn('Application tracking is not initialized');
    return;
  }

  if (screenName) {
    currentScreenName = screenName;
  }

  if (screenParams) {
    currentScreenParams = screenParams;
  }

  const payload: ApplicationEventPayload = {
    application: options.applicationId,
    screen: currentScreenName,
    params: currentScreenParams,
  };

  sendRequest('event', payload);
}

/**
 * Send application event to Tianji server
 *
 * @param options - Application tracking options
 * @param eventName - Name of the event
 * @param eventData - Event data
 */
export async function reportApplicationEvent(
  eventName: string,
  eventData: Record<string, any> = {},
  screenName?: string,
  screenParams?: Record<string, any>
): Promise<void> {
  if (!options) {
    console.warn('Application tracking is not initialized');
    return;
  }

  const payload: ApplicationEventPayload = {
    application: options.applicationId,
    name: eventName,
    data: eventData,
    screen: screenName ?? currentScreenName,
    params: screenParams ?? currentScreenParams,
  };

  sendRequest('event', payload);
}

export interface VersionPayload {
  version?: string;
  sdkVersion?: string;
}

/**
 * Identify user in application
 *
 * @param options - Application tracking options
 * @param userData - User identification data
 */
export async function identifyApplicationUser(
  userInfo: IdentifyPayload | VersionPayload
): Promise<void> {
  if (!options) {
    console.warn('Application tracking is not initialized');
    return;
  }

  if (!userInfo || Object.keys(userInfo).length === 0) {
    console.warn('User data is required for identification');
    return;
  }

  const payload: ApplicationIdentifyPayload = {
    application: options.applicationId,
    data: userInfo,
  };

  sendRequest('identify', payload);
}

/**
 * Send request with automatic batching
 */
function sendRequest(
  type: 'event' | 'identify',
  payload: ApplicationEventPayload | ApplicationIdentifyPayload
): void {
  if (!batchManager) {
    console.warn('Application tracking is not initialized');
    return;
  }

  batchManager.add(type, payload);
}

/**
 * Send single request to Tianji application API (fallback when batch is disabled)
 */
async function sendSingleRequest(
  serverUrl: string,
  type: 'event' | 'identify',
  payload: ApplicationEventPayload | ApplicationIdentifyPayload
): Promise<void> {
  try {
    const response = await fetch(`${serverUrl}/api/application/send`, {
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
      throw new Error(`Failed to send application ${type}: ${errorText}`);
    }
  } catch (error) {
    console.error(`Error sending application ${type}:`, error);
    return; // As event tracking SDK, should not throw error which maybe cause crash
  }
}

/**
 * Send batch request to Tianji application API
 */
async function sendBatchRequest(
  serverUrl: string,
  items: BatchItem[]
): Promise<void> {
  try {
    const response = await fetch(`${serverUrl}/api/application/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: items,
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
 * Useful for ensuring events are sent before app closes
 */
export async function flushApplicationBatchQueue(): Promise<void> {
  if (batchManager) {
    await batchManager.flush();
  }
}
