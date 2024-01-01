import { Monitor, Notification } from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { monitorProviders } from './provider';
import { sendNotification } from '../notification';
import dayjs from 'dayjs';
import { logger } from '../../utils/logger';

/**
 * Class which actually run monitor data collect
 */
export class MonitorRunner {
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
      try {
        let value = 0;
        try {
          value = await provider.run(monitor);
        } catch (err) {
          logger.error(`[Monitor] (id: ${monitor.id}) run error:`, String(err));
          value = -1;
        }

        // check event update
        if (value < 0 && currentStatus === 'UP') {
          await this.createEvent(
            'DOWN',
            `Monitor [${monitor.name}] has been down`
          );
          await this.notify(
            `[${monitor.name}] 🔴 Down`,
            `[${monitor.name}] 🔴 Down\nTime: ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss (z)'
            )}`
          );
          currentStatus = 'DOWN';
        } else if (value > 0 && currentStatus === 'DOWN') {
          await this.createEvent('UP', `Monitor [${monitor.name}] has been up`);
          await this.notify(
            `[${monitor.name}] ✅ Up`,
            `[${monitor.name}] ✅ Up\nTime: ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss (z)'
            )}`
          );
          currentStatus = 'UP';
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
      } catch (err) {
        logger.error('Run monitor error,', monitor.id, String(err));
      }
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

  async createEvent(type: 'UP' | 'DOWN', message: string) {
    return await prisma.monitorEvent.create({
      data: {
        message,
        monitorId: this.monitor.id,
        type,
      },
    });
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
