import { Monitor, Notification } from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { monitorProviders } from './provider';
import { sendNotification } from '../notification';
import dayjs from 'dayjs';

export type MonitorUpsertData = Pick<
  Monitor,
  'workspaceId' | 'name' | 'type' | 'interval'
> & { id?: string; active?: boolean; payload: Record<string, any> };

type MonitorWithNotification = Monitor & { notifications: Notification[] };

class MonitorManager {
  private monitorRunner: Record<string, MonitorRunner> = {};
  private isStarted = false;

  /**
   * create or update
   */
  async upsert(data: MonitorUpsertData): Promise<MonitorWithNotification> {
    let monitor: MonitorWithNotification;
    if (data.id) {
      // update
      monitor = await prisma.monitor.update({
        where: {
          id: data.id,
        },
        data: { ...data },
        include: {
          notifications: true,
        },
      });

      return monitor;
    } else {
      // create
      monitor = await prisma.monitor.create({
        data: { ...data },
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
          console.error('Start monitor error:', err);
        }
      })
    ).then(() => {
      console.log('All monitor has been begin.');
    });
  }
}

/**
 * Class which actually run monitor data collect
 */
class MonitorRunner {
  isStopped = false;
  timer: NodeJS.Timeout | null = null;

  constructor(public monitor: Monitor & { notifications: Notification[] }) {}

  /**
   * Start single monitor
   */
  async startMonitor() {
    const monitor = this.monitor;
    const { type, interval, workspaceId } = monitor;

    const provider = monitorProviders[type];
    if (!provider) {
      throw new Error(`Unknown monitor type: ${type}`);
    }

    let currentStatus: 'UP' | 'DOWN' = 'UP';

    const nextAction = () => {
      if (this.isStopped === true) {
        return;
      }

      this.timer = setTimeout(() => {
        run();
      }, interval * 1000);
    };

    const run = async () => {
      let value = 0;
      try {
        value = await provider.run(monitor);
      } catch (err) {
        console.error(err);
        value = -1;
      }

      // check event update
      if (value < 0 && currentStatus === 'UP') {
        await prisma.monitorEvent.create({
          data: {
            message: `Monitor ${monitor.name} has been down`,
            monitorId: monitor.id,
            type: 'DOWN',
          },
        });
        await this.notify(
          `[${monitor.name}] 🔴 Down`,
          `[${monitor.name}] 🔴 Down\nTime: ${dayjs().format(
            'YYYY-MM-DD HH:mm:ss'
          )}`
        );
      } else if (value > 0 && currentStatus === 'DOWN') {
        await prisma.monitorEvent.create({
          data: {
            message: `Monitor ${monitor.name} has been up`,
            monitorId: monitor.id,
            type: 'UP',
          },
        });
        await this.notify(
          `[${monitor.name}] ✅ Up`,
          `[${monitor.name}] ✅ Up\nTime: ${dayjs().format(
            'YYYY-MM-DD HH:mm:ss'
          )}`
        );
      }

      // insert into data
      const data = await prisma.monitorData.create({
        data: {
          monitorId: monitor.id,
          value,
        },
      });

      subscribeEventBus.emit('onMonitorReceiveNewData', workspaceId, data);

      // Run next loop
      nextAction();
    };

    run();

    console.log(`Start monitor ${monitor.name}(${monitor.id})`);
  }

  stopMonitor() {
    const monitor = this.monitor;

    this.isStopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    console.log(`Stop monitor ${monitor.name}(${monitor.id})`);
  }

  async restartMonitor() {
    this.stopMonitor();
    this.startMonitor();
  }

  async notify(title: string, message: string) {
    const notifications = this.monitor.notifications;
    await Promise.all(
      notifications.map((n) =>
        sendNotification(n, title, message).catch((err) => {
          console.error(err);
        })
      )
    );
  }
}

export const monitorManager = new MonitorManager();
