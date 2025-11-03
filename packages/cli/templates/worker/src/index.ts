/**
 * Tianji Worker Example
 *
 * This is a simple example worker that handles HTTP requests.
 * You can modify this to suit your needs.
 *
 * Note: The fetch function will be directly exposed after build.
 * Do not use export/import syntax, write plain functions.
 */

interface RequestPayload {
  [key: string]: any;
}

interface RequestContext {
  type: 'http' | 'cron';
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}

/**
 * Main Tianji worker handler function
 * This function will be called when the worker is triggered
 *
 * @param payload - The request payload (query params + body)
 * @param context - The request context
 * @returns Response data
 */
function fetch(payload: RequestPayload, context: RequestContext) {
  // Log the incoming request
  console.log('Worker triggered:', {
    type: context.type,
    payload,
  });

  // Example: Echo the payload back
  return {
    success: true,
    message: 'Hello from Tianji Worker!',
    receivedPayload: payload,
    timestamp: new Date().toISOString(),
  };
}
