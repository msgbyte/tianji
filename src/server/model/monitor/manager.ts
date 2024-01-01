import { Monitor, Notification } from '@prisma/client';
import { prisma } from '../_client';
import { MonitorRunner } from './runner';

export type MonitorUpsertData = Pick<
  Monitor,
  'workspaceId' | 'name' | 'type' | 'interval'
> & {
  id?: string;
  active?: boolean;
  notificationIds?: string[];
  payload: Record<string, any>;
};

type MonitorWithNotification = Monitor & { notifications: Notification[] };

export class MonitorManager {
  private monitorRunner: Record<string, MonitorRunner> = {};
  private isStarted = false;

  /**
   * create or update
   */
  async upsert(data: MonitorUpsertData): Promise<MonitorWithNotification> {
    let monitor: MonitorWithNotification;
    const { id, notificationIds = [], ...others } = data;
    if (id) {
      // update
      monitor = await prisma.monitor.update({
        where: {
          id,
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

    const runner = (this.monitorRunner[monitor.id] = new MonitorRunner(
      monitor
    ));
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
      console.warn('MonitorManager.startAll should only call once, skipped.');
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
          const runner = new MonitorRunner(m);
          this.monitorRunner[m.id] = runner;
          await runner.startMonitor();
        } catch (err) {
          console.error('Start monitor error:', String(err));
        }
      })
    ).then(() => {
      console.log('All monitor has been begin.');
    });
  }

  getRunner(monitorId: string): MonitorRunner | undefined {
    return this.monitorRunner[monitorId];
  }
}
