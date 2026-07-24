import { Monitor } from '@prisma/client';
import { prisma } from '../_client.js';
import { MonitorRunner } from './runner.js';
import { logger } from '../../utils/logger.js';
import { MonitorWithNotification } from './types.js';
import { promMonitorRunnerCounter } from '../../utils/prometheus/client.js';
import {
  monitorBroadcast,
  type MonitorBroadcastEvent,
} from './broadcast.js';

export type MonitorUpsertData = Pick<
  Monitor,
  | 'workspaceId'
  | 'name'
  | 'type'
  | 'interval'
  | 'maxRetries'
  | 'trendingMode'
  | 'upMessageTemplate'
  | 'downMessageTemplate'
> & {
  id?: string;
  active?: boolean;
  notificationIds?: string[];
  payload: Record<string, any>;
};

export class MonitorManager {
  private monitorRunner: Record<string, MonitorRunner> = {};
  private lifecycleTails = new Map<string, Promise<void>>();
  private isStarted = false;

  private runLifecycle<T>(
    monitorId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const previous = this.lifecycleTails.get(monitorId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(operation);
    const tail = result.then(
      () => undefined,
      () => undefined
    );
    this.lifecycleTails.set(monitorId, tail);

    return result.finally(() => {
      if (this.lifecycleTails.get(monitorId) === tail) {
        this.lifecycleTails.delete(monitorId);
      }
    });
  }

  /**
   * create or update
   */
  async upsert(data: MonitorUpsertData): Promise<MonitorWithNotification> {
    const { id, workspaceId, notificationIds = [], ...others } = data;
    if (id) {
      return this.runLifecycle(id, async () => {
        const monitor = await prisma.monitor.update({
          where: {
            id,
            workspaceId,
          },
          data: {
            ...others,
            notifications: {
              set: notificationIds.map((id) => ({ id })),
            },
          },
          include: {
            notifications: true,
          },
        });

        void monitorBroadcast.publish('update', workspaceId, monitor.id);
        await this.applyMonitorStateUnlocked(monitor);

        return monitor;
      });
    }

    const monitor = await prisma.monitor.create({
      data: {
        ...others,
        workspaceId,
        notifications: {
          connect: notificationIds.map((id) => ({ id })),
        },
      },
      include: {
        notifications: true,
      },
    });

    return this.runLifecycle(monitor.id, async () => {
      void monitorBroadcast.publish('create', workspaceId, monitor.id);
      await this.applyMonitorStateUnlocked(monitor);

      return monitor;
    });
  }

  async delete(workspaceId: string, monitorId: string) {
    return this.runLifecycle(monitorId, async () => {
      const monitor = await prisma.monitor.delete({
        where: {
          workspaceId,
          id: monitorId,
        },
      });

      this.removeRunner(monitorId);
      void monitorBroadcast.publish('delete', workspaceId, monitorId);

      return monitor;
    });
  }

  /**
   * Get and start all monitors
   */
  async startAll() {
    if (this.isStarted === true) {
      logger.warn('MonitorManager.startAll should only call once, skipped.');
      return;
    }

    this.isStarted = true;

    try {
      await this.reconcileAll();
      logger.info('All monitor has been begin.');
    } catch (err) {
      this.isStarted = false;
      throw err;
    }
  }

  getRunner(monitorId: string): MonitorRunner | undefined {
    return this.monitorRunner[monitorId];
  }

  private updateRunnerMetric() {
    promMonitorRunnerCounter.set(Object.keys(this.monitorRunner).length);
  }

  removeRunner(monitorId: string): void {
    this.monitorRunner[monitorId]?.stopMonitor();
    delete this.monitorRunner[monitorId];
    this.updateRunnerMetric();
  }

  async reconcile(workspaceId: string, monitorId: string): Promise<void> {
    return this.runLifecycle(monitorId, () =>
      this.reconcileUnlocked(workspaceId, monitorId)
    );
  }

  private async reconcileUnlocked(
    workspaceId: string,
    monitorId: string
  ): Promise<void> {
    const monitor = await prisma.monitor.findUnique({
      where: {
        id: monitorId,
        workspaceId,
      },
      include: {
        notifications: true,
      },
    });

    if (!monitor?.active) {
      this.removeRunner(monitorId);
      return;
    }

    await this.applyMonitorStateUnlocked(monitor);
  }

  async reconcileAll(): Promise<void> {
    const activeMonitors = await prisma.monitor.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });
    const monitors = new Map<string, string>();

    Object.values(this.monitorRunner).forEach((runner) => {
      monitors.set(runner.monitor.id, runner.monitor.workspaceId);
    });
    activeMonitors.forEach((monitor) => {
      monitors.set(monitor.id, monitor.workspaceId);
    });

    await Promise.all(
      Array.from(monitors, async ([monitorId, workspaceId]) => {
        try {
          await this.reconcile(workspaceId, monitorId);
        } catch (err) {
          logger.error('Reconcile monitor error:', String(err));
        }
      })
    );
  }

  async handleBroadcast(event: MonitorBroadcastEvent): Promise<void> {
    await this.reconcile(event.workspaceId, event.monitorId);
  }

  async setActive(workspaceId: string, monitorId: string, active: boolean) {
    return this.runLifecycle(monitorId, async () => {
      const monitor = await prisma.monitor.update({
        where: {
          workspaceId,
          id: monitorId,
        },
        data: {
          active,
        },
        include: {
          notifications: true,
        },
      });

      void monitorBroadcast.publish(
        active ? 'start' : 'stop',
        workspaceId,
        monitorId
      );
      const runner = await this.applyMonitorStateUnlocked(monitor);

      return { monitor, runner };
    });
  }

  private async applyMonitorStateUnlocked(
    monitor: MonitorWithNotification
  ): Promise<MonitorRunner | undefined> {
    if (!monitor.active) {
      this.removeRunner(monitor.id);
      return undefined;
    }

    const runner = await this.createRunner(monitor);
    await runner.startMonitor();
    return runner;
  }

  /**
   * Restart all runner basic on workspace id
   */
  async restartWithWorkspaceId(workspaceId: string): Promise<void> {
    const monitorIds = Object.values(this.monitorRunner)
      .filter((runner) => runner.workspace.id === workspaceId)
      .map((runner) => runner.monitor.id);

    await Promise.all(
      monitorIds.map((monitorId) => this.reconcile(workspaceId, monitorId))
    );
  }

  /**
   * create runner
   */
  async createRunner(monitor: MonitorWithNotification) {
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: {
        id: monitor.workspaceId,
      },
    });
    this.removeRunner(monitor.id);
    const runner = new MonitorRunner(workspace, monitor);
    this.monitorRunner[monitor.id] = runner;

    this.updateRunnerMetric();

    return runner;
  }

  /**
   * ensure runner has been created.
   */
  async ensureRunner(workspaceId: string, monitorId: string) {
    const runner = this.getRunner(monitorId);
    if (runner) {
      return runner;
    }

    await this.reconcile(workspaceId, monitorId);

    const reconciledRunner = this.getRunner(monitorId);
    if (!reconciledRunner) {
      throw new Error('Monitor not found or inactive');
    }

    return reconciledRunner;
  }
}
