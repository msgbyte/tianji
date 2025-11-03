import { initOpenapiSDK, openApiClient } from 'tianji-client-sdk';
import { GlobalConfig } from './config.js';

export interface WorkerUpsertInput {
  id?: string;
  name: string;
  description?: string;
  code: string;
  active?: boolean;
  enableCron?: boolean;
  cronExpression?: string;
}

export interface WorkerInfo {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  code: string;
  active: boolean;
  enableCron: boolean;
  cronExpression: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize API client with config
 */
export class TianjiAPI {
  private config: GlobalConfig;

  constructor(config: GlobalConfig) {
    this.config = config;

    // Initialize the OpenAPI SDK
    initOpenapiSDK(config.serverUrl, {
      apiKey: config.apiKey,
    });
  }

  /**
   * Test connection by calling worker get endpoint with an invalid ID
   * Uses the OpenAPI SDK
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get a worker with an invalid ID just to test auth
      // This will fail but if auth is correct, it won't be a 401/403
      await openApiClient.WorkerService.workerGet({
        workspaceId: this.config.workspaceId,
        workerId: 'test-invalid-id',
      }).catch((error: any) => {
        // If it's not an auth error, the connection is valid
        if (error.status !== 401 && error.status !== 403) {
          return true;
        }
        throw error;
      });
      return true;
    } catch (error: any) {
      // If we get 401 or 403, auth is invalid
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      // Any other error means connection is OK (just worker doesn't exist or other issue)
      return true;
    }
  }

  /**
   * Upsert worker (create or update)
   * Uses the OpenAPI SDK WorkerService
   */
  async upsertWorker(input: WorkerUpsertInput): Promise<WorkerInfo> {
    const result = await openApiClient.WorkerService.workerUpsert({
      workspaceId: this.config.workspaceId,
      requestBody: input,
    });

    return result as WorkerInfo;
  }

  /**
   * Get worker by ID
   * Uses the OpenAPI SDK WorkerService
   */
  async getWorker(workerId: string): Promise<WorkerInfo | null> {
    try {
      const result = await openApiClient.WorkerService.workerGet({
        workspaceId: this.config.workspaceId,
        workerId,
      });

      return result as WorkerInfo;
    } catch (error: any) {
      // If worker not found, return null
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

/**
 * Create API client from config
 */
export function createAPIClient(config: GlobalConfig): TianjiAPI {
  return new TianjiAPI(config);
}
