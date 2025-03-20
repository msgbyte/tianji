/**
 * Client SDK for Tianji Application API
 */

import { IdentifyPayload } from './types';

/**
 * Application event payload interface
 */
export interface ApplicationEventPayload {
  /**
   * Application data object
   */
  data?: Record<string, any>;
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
}

let options: ApplicationTrackingOptions | undefined;
export function initApplication(_options: ApplicationTrackingOptions) {
  options = _options;
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

  sendApplicationRequest(options.serverUrl, 'event', payload);
}

/**
 * Identify user in application
 *
 * @param options - Application tracking options
 * @param userData - User identification data
 */
export async function identifyApplicationUser(
  userInfo: IdentifyPayload
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

  sendApplicationRequest(options.serverUrl, 'identify', payload);
}

/**
 * Send request to Tianji application API
 *
 * @param serverUrl - Tianji server URL
 * @param type - Request type ('event' or 'identify')
 * @param payload - Request payload
 * @returns Promise with token string
 */
async function sendApplicationRequest(
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
