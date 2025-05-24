import { MonitorProvider } from './type.js';
import { prisma } from '../../_client.js';
import { logger } from '../../../utils/logger.js';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { updateMonitorErrorMessage } from '../index.js';

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
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { pushToken, timeout = 60 } = monitor.payload;

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
        // If there is no record of the last push, it means no push has been received yet, return normal status
        // This gives users a buffer period to set up their first push
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

      // If the timeout is exceeded, the monitoring is considered failed
      if (diffInSeconds > timeout) {
        logger.info(
          `[Monitor Push] Monitor ${monitor.id} timeout: ${diffInSeconds}s > ${timeout}s`
        );
        return -1;
      }

      // return 0 to skip logic
      return 0;
    } catch (err) {
      logger.error(`[Monitor Push] Error checking push status: ${String(err)}`);
      return -1;
    }
  },
};
