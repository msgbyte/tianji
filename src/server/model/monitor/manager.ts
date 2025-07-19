import { Monitor } from '@prisma/client';
import { prisma } from '../_client.js';
import { MonitorRunner } from './runner.js';
import { logger } from '../../utils/logger.js';
import { MonitorWithNotification } from './types.js';
import { promMonitorRunnerCounter } from '../../utils/prometheus/client.js';

export type MonitorUpsertData = Pick<
  Monitor,
  'workspaceId' | 'name' | 'type' | 'interval' | 'maxRetries' | 'trendingMode'
> & {
  id?: string;
  active?: boolean;
  notificationIds?: string[];
  payload: Record<string, any>;
};

export class MonitorManager {
  private monitorRunner: Record<string, MonitorRunner> = {};
  private isStarted = false;

  /**
   * create or update
   */
  async upsert(data: MonitorUpsertData): Promise<MonitorWithNotification> {
    let monitor: MonitorWithNotification;
    const { id, workspaceId, notificationIds = [], ...others } = data;
    if (id) {
      // update
      monitor = await prisma.monitor.update({
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
    } else {
      // create
      monitor = await prisma.monitor.create({
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
    }

    if (this.monitorRunner[monitor.id]) {
      // Stop and remove old
      this.monitorRunner[monitor.id].stopMonitor();
      delete this.monitorRunner[monitor.id];
    }

    const runner = await this.createRunner(monitor);
    runner.startMonitor();

    return monitor;
  }

  async delete(workspaceId: string, monitorId: string) {
    const runner = this.getRunner(monitorId);
    if (!runner) {
      throw new Error('This monitor not found');
    }

    runner.stopMonitor();
    delete this.monitorRunner[monitorId];

    return prisma.monitor.delete({
      where: {
        workspaceId,
        id: monitorId,
      },
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

    const monitors = await prisma.monitor.findMany({
      where: {
        active: true,
      },
      include: {
        notifications: true,
      },
    });

    Promise.all(
      monitors.map(async (m) => {
        try {
          const runner = await this.createRunner(m);
          this.monitorRunner[m.id] = runner;
          await runner.startMonitor();
        } catch (err) {
          logger.error('Start monitor error:', String(err));
        }
      })
    ).then(() => {
      logger.info('All monitor has been begin.');
    });
  }

  getRunner(monitorId: string): MonitorRunner | undefined {
    return this.monitorRunner[monitorId];
  }

  /**
   * Restart all runner basic on workspace id
   */
  restartWithWorkspaceId(workspaceId: string) {
    Object.values(this.monitorRunner).map((runner) => {
      if (runner.workspace.id === workspaceId) {
        this.createRunner(runner.monitor);
      }
    });
  }

  /**
   * create runner
   */
  async createRunner(monitor: MonitorWithNotification) {
    if (this.monitorRunner[monitor.id]) {
      this.monitorRunner[monitor.id].stopMonitor();
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: {
        id: monitor.workspaceId,
      },
    });
    const runner = (this.monitorRunner[monitor.id] = new MonitorRunner(
      workspace,
      monitor
    ));

    promMonitorRunnerCounter.set(Object.keys(this.monitorRunner).length);

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

    const monitor = await prisma.monitor.findUnique({
      where: {
        id: monitorId,
        workspaceId,
      },
      include: {
        notifications: true,
      },
    });

    if (!monitor) {
      throw new Error('Monitor not found');
    }

    if (!monitor.active) {
      throw new Error('Monitor is not active');
    }

    return this.createRunner(monitor);
  }
}
