import { Monitor } from '@prisma/client';
import { createSubscribeInitializer, subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { monitorProviders } from './provider';

export type MonitorUpsertData = Pick<
  Monitor,
  'workspaceId' | 'name' | 'type' | 'interval'
> & { id?: string; active?: boolean; payload: Record<string, any> };

class MonitorManager {
  private monitorRunner: Record<string, MonitorRunner> = {};
  private isStarted = false;

  /**
   * create or update
   */
  async upsert(data: MonitorUpsertData): Promise<Monitor> {
    let monitor: Monitor;
    if (data.id) {
      // update
      monitor = await prisma.monitor.update({
        where: {
          id: data.id,
        },
        data: { ...data },
      });

      return monitor;
    } else {
      // create
      monitor = await prisma.monitor.create({
        data: { ...data },
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

  constructor(public monitor: Monitor) {}

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

    async function run() {
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
      } else if (value > 0 && currentStatus === 'DOWN') {
        await prisma.monitorEvent.create({
          data: {
            message: `Monitor ${monitor.name} has been up`,
            monitorId: monitor.id,
            type: 'UP',
          },
        });
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
    }

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
}

export const monitorManager = new MonitorManager();
