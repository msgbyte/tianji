import { MonitorProvider } from './type.js';
import { prisma } from '../../_client.js';
import { logger } from '../../../utils/logger.js';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { updateMonitorErrorMessage } from '../index.js';
import { CronExpressionParser } from 'cron-parser';

/**
 * Push monitor provider
 * Implement monitoring through push points, judging whether the last push time exceeds the expected time interval
 */
export const push: MonitorProvider<{
  /**
   * Push token, used to verify push requests
   */
  pushToken: string;
  /**
   * Maximum timeout time (seconds)
   * If no push is received within this time, the monitoring is considered failed
   */
  timeout: number;
  /**
   * Enable cron schedule checking
   */
  enableCron?: boolean;
  /**
   * Cron expression for scheduled checks
   */
  cronExpression?: string;
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const {
      pushToken,
      timeout = 60,
      enableCron = false,
      cronExpression = '*/5 * * * *',
    } = monitor.payload;

    // If there is no pushToken, generate one
    if (!pushToken) {
      // Generate a unique pushToken and save it
      const newPushToken = nanoid(16);
      await prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          payload: {
            ...monitor.payload,
            pushToken: newPushToken,
          },
        },
      });

      monitor.payload.pushToken = newPushToken;

      return 0;
    }

    try {
      const lastPushStatus = await prisma.monitorStatus.findUnique({
        where: {
          monitorId_statusName: {
            monitorId: monitor.id,
            statusName: 'lastPush',
          },
        },
      });

      if (!lastPushStatus) {
        // If there is no record of the last push, it means no push has been received yet
        await updateMonitorErrorMessage(
          monitor.id,
          'First push has not been received'
        );
        return 0;
      }

      const lastPushTime = lastPushStatus.payload.lastPushTime;
      if (!lastPushTime) {
        await updateMonitorErrorMessage(
          monitor.id,
          'First push has not been received'
        );
        return 0;
      }

      const lastPushTimeObj = dayjs(lastPushTime);
      const now = dayjs();
      const diffInSeconds = now.diff(lastPushTimeObj, 'second');

      if (enableCron && cronExpression) {
        // Use cron mode to check
        try {
          // Parse the cron expression with last push time as base
          const cron = CronExpressionParser.parse(cronExpression);

          // Get the previous execution time
          const prevExecutionTime = cron.prev().toDate();
          if (!prevExecutionTime) {
            throw new Error(
              `Cannot determine previous execution time for cron: ${cronExpression}`
            );
          }
          const prevExecutionDayjs = dayjs(prevExecutionTime);

          // Calculate the difference between the last push and the last scheduled execution time (seconds)
          const lastPushDiffFromSchedule = lastPushTimeObj.diff(
            prevExecutionDayjs,
            'second'
          );
          const currentDiffFromSchedule = now.diff(
            prevExecutionDayjs,
            'second'
          );

          if (
            lastPushDiffFromSchedule < 0 &&
            -lastPushDiffFromSchedule > timeout &&
            currentDiffFromSchedule - timeout > 0
          ) {
            const errorMsg = `Last push time (${lastPushTimeObj.format('YYYY-MM-DD HH:mm:ss')}) exceeded tolerance range for scheduled time (${prevExecutionDayjs.format('YYYY-MM-DD HH:mm:ss')})`;
            logger.info(`[Monitor Push] ${errorMsg}`);
            await updateMonitorErrorMessage(monitor.id, errorMsg);
            return -1;
          }

          // Normal return - cron check passed
          return 0;
        } catch (cronErr) {
          // cron expression parsing error
          logger.error(
            `[Monitor Push] Invalid cron expression: ${cronExpression}, error: ${String(cronErr)}`
          );
          await updateMonitorErrorMessage(
            monitor.id,
            `Invalid cron expression: ${cronExpression}`
          );
          return -1;
        }
      } else {
        // Standard mode - if the timeout is exceeded, the monitoring is considered failed
        if (diffInSeconds > timeout) {
          const errorMsg = `Timeout: ${diffInSeconds}s > ${timeout}s`;
          logger.info(`[Monitor Push] Monitor ${monitor.id} ${errorMsg}`);
          await updateMonitorErrorMessage(monitor.id, errorMsg);
          return -1;
        }
      }

      // Return normal status and time difference (milliseconds)
      return 0;
    } catch (err) {
      logger.error(`[Monitor Push] Error checking push status: ${String(err)}`);
      return -1;
    }
  },
};
