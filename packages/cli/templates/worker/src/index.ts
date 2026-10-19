/**
 * Tianji Worker Example
 *
 * This is a simple example worker that handles HTTP requests.
 * You can modify this to suit your needs.
 *
 * Export a Module Worker as the default entry point.
 */

interface RequestPayload {
  [key: string]: any;
}

interface RequestContext {
  type: 'http' | 'cron' | 'manual' | 'test';
  env: Record<string, string>;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}

type WorkerResult = unknown;
type WorkerFunction = (
  payload: RequestPayload,
  context: RequestContext
) => WorkerResult | Promise<WorkerResult>;

interface TianjiWorker {
  fetch: WorkerFunction;
}

/**
 * Main Tianji worker handler function
 * This function will be called when the worker is triggered
 *
 * @param payload - The request payload (query params + body)
 * @param context - The request context
 * @returns Response data
 */
export default {
  async fetch(payload, context) {
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
  },
} satisfies TianjiWorker;
