import { FunctionWorker } from '@prisma/client';
import { prisma } from '../_client.js';
import { WorkerCronRunner } from './cronRunner.js';
import { logger } from '../../utils/logger.js';
import { delWorkerCache } from './index.js';
import {
  syncWorkerEnvironmentVariables,
  type WorkerEnvironmentVariableInput,
} from './environment.js';
import {
  workerCronBroadcast,
  type WorkerCronBroadcastEvent,
} from './broadcast.js';

export type WorkerCronUpsertData = Pick<
  FunctionWorker,
  'workspaceId' | 'name' | 'code' | 'enableCron' | 'cronExpression'
> & {
  id?: string;
  creatorId?: string;
  ownerId?: string;
  operatorId?: string;
  active?: boolean;
  description?: string;
  environmentVariables?: WorkerEnvironmentVariableInput[];
};

export class WorkerCronManager {
  private workerRunners: Record<string, WorkerCronRunner> = {};
  private lifecycleTails = new Map<string, Promise<void>>();
  private isStarted = false;

  private runLifecycle<T>(
    workerId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const previous = this.lifecycleTails.get(workerId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(operation);
    const tail = result.then(
      () => undefined,
      () => undefined
    );
    this.lifecycleTails.set(workerId, tail);

    return result.finally(() => {
      if (this.lifecycleTails.get(workerId) === tail) {
        this.lifecycleTails.delete(workerId);
      }
    });
  }

  /**
   * Create or update worker cron job
   */
  async upsert(data: WorkerCronUpsertData): Promise<FunctionWorker> {
    const {
      id,
      workspaceId,
      creatorId,
      operatorId,
      environmentVariables,
      ...others
    } = data;

    if (id) {
      return this.runLifecycle(id, async () => {
        const existingWorker = await prisma.functionWorker.findUnique({
          where: {
            id,
            workspaceId,
          },
        });

        if (!existingWorker) {
          throw new Error('Worker not found');
        }

        const shouldCreateRevision =
          others.code !== undefined && others.code !== existingWorker.code;

        const worker = await prisma.$transaction(async (tx) => {
          const nextRevision = shouldCreateRevision
            ? existingWorker.revision + 1
            : existingWorker.revision;

          const updatedWorker = await tx.functionWorker.update({
            where: {
              id,
              workspaceId,
            },
            data: {
              ...others,
              revision: nextRevision,
            },
          });

          if (environmentVariables !== undefined) {
            await syncWorkerEnvironmentVariables(
              tx,
              updatedWorker.id,
              environmentVariables
            );
          }

          delWorkerCache(id, workspaceId);

          if (shouldCreateRevision) {
            await tx.functionWorkerRevision.create({
              data: {
                workerId: updatedWorker.id,
                operatorId,
                revision: updatedWorker.revision,
                code: updatedWorker.code,
              },
            });
          }
          return updatedWorker;
        });

        void workerCronBroadcast.publish('update', workspaceId, worker.id);
        await this.applyWorkerStateUnlocked(worker);

        return worker;
      });
    }

    const worker = await prisma.$transaction(async (tx) => {
      const createdWorker = await tx.functionWorker.create({
        data: {
          ...others,
          revision: 1,
          workspaceId,
          creatorId,
        },
      });

      await tx.functionWorkerRevision.create({
        data: {
          workerId: createdWorker.id,
          operatorId,
          revision: createdWorker.revision,
          code: createdWorker.code,
        },
      });

      await syncWorkerEnvironmentVariables(
        tx,
        createdWorker.id,
        environmentVariables ?? []
      );

      return createdWorker;
    });

    return this.runLifecycle(worker.id, async () => {
      void workerCronBroadcast.publish('create', workspaceId, worker.id);
      await this.applyWorkerStateUnlocked(worker);

      return worker;
    });
  }

  async delete(workspaceId: string, workerId: string) {
    return this.runLifecycle(workerId, async () => {
      const worker = await prisma.functionWorker.delete({
        where: {
          workspaceId,
          id: workerId,
        },
      });

      delWorkerCache(workerId, workspaceId);
      await this.removeRunner(workerId);
      void workerCronBroadcast.publish('delete', workspaceId, workerId);

      return worker;
    });
  }

  /**
   * Get and start all worker cron jobs
   */
  async startAll() {
    if (this.isStarted === true) {
      logger.warn('WorkerCronManager.startAll should only call once, skipped.');
      return;
    }

    this.isStarted = true;

    try {
      await this.reconcileAll();
      logger.info(
        `Started ${Object.keys(this.workerRunners).length} worker cron jobs.`
      );
    } catch (err) {
      this.isStarted = false;
      throw err;
    }
  }

  getRunner(workerId: string): WorkerCronRunner | undefined {
    return this.workerRunners[workerId];
  }

  private async removeRunner(workerId: string): Promise<void> {
    const runner = this.getRunner(workerId);
    if (!runner) {
      return;
    }

    await runner.stopCron();
    delete this.workerRunners[workerId];
  }

  async reconcile(workspaceId: string, workerId: string): Promise<void> {
    return this.runLifecycle(workerId, () =>
      this.reconcileUnlocked(workspaceId, workerId)
    );
  }

  private async reconcileUnlocked(
    workspaceId: string,
    workerId: string
  ): Promise<void> {
    const worker = await prisma.functionWorker.findUnique({
      where: {
        id: workerId,
        workspaceId,
      },
    });

    if (
      !worker?.active ||
      !worker.enableCron ||
      !worker.cronExpression
    ) {
      await this.removeRunner(workerId);
      return;
    }

    await this.applyWorkerStateUnlocked(worker);
  }

  async reconcileAll(): Promise<void> {
    const activeWorkers = await prisma.functionWorker.findMany({
      where: {
        active: true,
        enableCron: true,
        cronExpression: {
          not: null,
        },
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });
    const workers = new Map<string, string>();

    Object.values(this.workerRunners).forEach((runner) => {
      workers.set(runner.worker.id, runner.worker.workspaceId);
    });
    activeWorkers.forEach((worker) => {
      workers.set(worker.id, worker.workspaceId);
    });

    await Promise.all(
      Array.from(workers, async ([workerId, workspaceId]) => {
        try {
          await this.reconcile(workspaceId, workerId);
        } catch (err) {
          logger.error('Reconcile worker cron error:', String(err));
        }
      })
    );
  }

  async handleBroadcast(event: WorkerCronBroadcastEvent): Promise<void> {
    await this.reconcile(event.workspaceId, event.workerId);
  }

  private async applyWorkerStateUnlocked(
    worker: FunctionWorker
  ): Promise<WorkerCronRunner | undefined> {
    if (!worker.active || !worker.enableCron || !worker.cronExpression) {
      await this.removeRunner(worker.id);
      return undefined;
    }

    const runner = await this.createRunner(worker);
    await runner.startCron();
    return runner;
  }

  /**
   * Restart all runners based on workspace id
   */
  restartWithWorkspaceId(workspaceId: string) {
    Object.values(this.workerRunners).map((runner) => {
      if (runner.workspace.id === workspaceId) {
        this.createRunner(runner.worker);
      }
    });
  }

  /**
   * Create runner
   */
  async createRunner(worker: FunctionWorker) {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: {
        id: worker.workspaceId,
      },
    });

    await this.removeRunner(worker.id);
    const runner = (this.workerRunners[worker.id] = new WorkerCronRunner(
      workspace,
      worker
    ));

    return runner;
  }

  /**
   * Ensure runner has been created
   */
  async ensureRunner(workspaceId: string, workerId: string) {
    const runner = this.getRunner(workerId);
    if (runner) {
      return runner;
    }

    const worker = await prisma.functionWorker.findUnique({
      where: {
        id: workerId,
        workspaceId,
      },
    });

    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!worker.active) {
      throw new Error('Worker is not active');
    }

    if (!worker.enableCron || !worker.cronExpression) {
      throw new Error(
        'Worker cron is not enabled or no cron expression provided'
      );
    }

    return this.createRunner(worker);
  }

  /**
   * Stop all cron jobs
   */
  async stopAll() {
    await Promise.all(
      Object.values(this.workerRunners).map((runner) => runner.stopCron())
    );
    this.workerRunners = {};
    logger.info('All worker cron jobs stopped.');
  }
}
