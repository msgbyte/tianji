import {
  FunctionWorker,
  Workspace,
  WorkspaceAuditLogType,
} from '@prisma/client';
import { Cron } from 'croner';
import { logger } from '../../utils/logger.js';
import { execWorker } from './index.js';
import { createAuditLog } from '../auditLog.js';
import dayjs from 'dayjs';
import { get } from 'lodash-es';
import { withDistributedLock } from '../../cache/distributedLock.js';

/**
 * Class which actually runs worker cron jobs
 */
export class WorkerCronRunner {
  private cronJob: Cron | null = null;
  private isStopped = false;

  constructor(
    public workspace: Workspace,
    public worker: FunctionWorker
  ) {}

  getTimezone(): string {
    return get(this.workspace, ['settings', 'timezone']) || 'utc';
  }

  private async runWorker() {
    const worker = this.worker;
    const lockName = `worker-execution:${worker.id}`;

    // Use distributed lock to ensure only one execution per worker at a time
    await withDistributedLock(
      lockName,
      async () => {
        try {
          logger.info(
            `[Worker Cron] Executing worker ${worker.name}(${worker.id}) with cron expression: ${worker.cronExpression}`
          );

          // Execute the worker
          const result = await execWorker(worker.code, worker.id, undefined, {
            type: 'cron',
          });

          logger.info(
            `[Worker Cron] Worker ${worker.name}(${worker.id}) executed successfully`
          );

          // Create audit log for successful execution
          createAuditLog({
            workspaceId: this.worker.workspaceId,
            relatedId: this.worker.id,
            relatedType: WorkspaceAuditLogType.FunctionWorker,
            content: `Worker(${worker.name}) cron execution completed successfully at ${dayjs()
              .tz(this.getTimezone())
              .format('YYYY-MM-DD HH:mm:ss (z)')}`,
          });

          return result;
        } catch (err) {
          const errorMessage = get(err, 'message', String(err));
          logger.error(
            `[Worker Cron] Worker ${worker.name}(${worker.id}) execution error:`,
            errorMessage
          );

          // Create audit log for failed execution
          createAuditLog({
            workspaceId: this.worker.workspaceId,
            relatedId: this.worker.id,
            relatedType: WorkspaceAuditLogType.FunctionWorker,
            content: `Worker(${worker.name}) cron execution failed at ${dayjs()
              .tz(this.getTimezone())
              .format('YYYY-MM-DD HH:mm:ss (z)')}: ${errorMessage}`,
          });

          throw err;
        }
      },
      {
        skipOnFailure: true, // Skip execution if lock is already held by another instance
      }
    );
  }

  /**
   * Start cron job for this worker
   */
  async startCron() {
    const worker = this.worker;

    if (!worker.enableCron || !worker.cronExpression) {
      logger.warn(
        `[Worker Cron] Worker ${worker.name}(${worker.id}) cron is not enabled or no cron expression provided`
      );
      return;
    }

    if (this.cronJob) {
      this.stopCron();
    }

    try {
      this.cronJob = new Cron(
        worker.cronExpression,
        async () => {
          if (this.isStopped) {
            return;
          }

          try {
            await this.runWorker();
          } catch (err) {
            logger.error(
              `[Worker Cron] Error executing worker ${worker.name}(${worker.id}):`,
              String(err)
            );
          }
        },
        {
          timezone: this.getTimezone(),
        }
      );

      this.isStopped = false;

      logger.info(
        `[Worker Cron] Started cron job for worker ${worker.name}(${worker.id}) with expression: ${worker.cronExpression}`
      );

      if (this.cronJob.nextRun()) {
        logger.info(
          `[Worker Cron] Next run for worker ${worker.name}(${worker.id}): ${this.cronJob.nextRun()?.toISOString()}`
        );
      }
    } catch (err) {
      logger.error(
        `[Worker Cron] Invalid cron expression for worker ${worker.name}(${worker.id}): ${worker.cronExpression}`,
        String(err)
      );

      createAuditLog({
        workspaceId: this.worker.workspaceId,
        relatedId: this.worker.id,
        relatedType: WorkspaceAuditLogType.FunctionWorker,
        content: `Worker(${worker.name}) cron expression validation failed: ${String(err)}`,
      });

      throw new Error(`Invalid cron expression: ${worker.cronExpression}`);
    }
  }

  /**
   * Stop cron job for this worker
   */
  stopCron() {
    const worker = this.worker;

    this.isStopped = true;

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    logger.info(
      `[Worker Cron] Stopped cron job for worker ${worker.name}(${worker.id})`
    );
  }

  /**
   * Restart cron job
   */
  async restartCron() {
    this.stopCron();
    await this.startCron();
  }

  /**
   * Manually trigger worker execution
   */
  async manualTrigger() {
    return await this.runWorker();
  }

  /**
   * Get next run time
   */
  getNextRun(): Date | null {
    return this.cronJob?.nextRun() || null;
  }

  /**
   * Check if cron job is running
   */
  isRunning(): boolean {
    return !this.isStopped && this.cronJob !== null;
  }
}
