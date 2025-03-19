/**
 * Client SDK for Tianji Application API
 */

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

/**
 * Send application event to Tianji server
 *
 * @param options - Application tracking options
 * @param eventName - Name of the event
 * @param eventData - Event data
 */
export async function reportApplicationEvent(
  options: ApplicationTrackingOptions,
  eventName: string,
  eventData: Record<string, any> = {}
): Promise<string> {
  const payload: ApplicationEventPayload = {
    application: options.applicationId,
    name: eventName,
    data: eventData,
  };

  return sendApplicationRequest(options.serverUrl, 'event', payload);
}

/**
 * Identify user in application
 *
 * @param options - Application tracking options
 * @param userData - User identification data
 */
export async function identifyApplicationUser(
  options: ApplicationTrackingOptions,
  userData: Record<string, any>
): Promise<string> {
  if (!userData || Object.keys(userData).length === 0) {
    throw new Error('User data is required for identification');
  }

  const payload: ApplicationIdentifyPayload = {
    application: options.applicationId,
    data: userData,
  };

  return sendApplicationRequest(options.serverUrl, 'identify', payload);
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
): Promise<string> {
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

    return await response.text();
  } catch (error) {
    console.error(`Error sending application ${type}:`, error);
    throw error;
  }
}
