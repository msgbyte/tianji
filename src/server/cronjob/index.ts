import { Cron } from 'croner';
import { logger } from '../utils/logger.js';
import { FeedChannelNotifyFrequency } from '@prisma/client';
import { env } from '../utils/env.js';
import { checkWorkspaceUsage } from '../model/billing/cronjob.js';
import {
  clearAuditLogDaily,
  clearMonitorDataDaily,
  clearMonitorEventDaily,
  dailyHTTPCertCheckNotify,
  dailyUpdateApplicationStoreInfo,
  statDailyUsage,
} from './daily.js';
import { checkFeedEventsNotify } from './shared.js';
import { promCronCounter } from '../utils/prometheus/client.js';
import { initClickHouseSyncCronjob } from '../clickhouse/cronjob.js';

export function initCronjob() {
  const dailyJob = Cron('0 2 * * *', async () => {
    logger.info('Start daily cronjob');

    try {
      promCronCounter.inc({ period: 'daily' });
      await Promise.all([
        statDailyUsage().catch(logger.error),
        clearMonitorDataDaily().catch(logger.error),
        clearMonitorEventDaily().catch(logger.error),
        clearAuditLogDaily().catch(logger.error),
        dailyHTTPCertCheckNotify().catch(logger.error),
        dailyUpdateApplicationStoreInfo().catch(logger.error),
        checkFeedEventsNotify(FeedChannelNotifyFrequency.day),
      ]);

      if (env.billing.enable) {
        await checkWorkspaceUsage();
      }

      logger.info('Daily cronjob completed');
    } catch (err) {
      logger.error('Daily cronjob error:', err);
    }
  });

  const weeklyJob = Cron('0 2 * * 1', async () => {
    logger.info('Start weekly cronjob');

    try {
      promCronCounter.inc({ period: 'weekly' });
      await Promise.all([
        checkFeedEventsNotify(FeedChannelNotifyFrequency.week),
      ]);

      logger.info('Weekly cronjob completed');
    } catch (err) {
      logger.error('Weekly cronjob error:', err);
    }
  });

  const monthlyJob = Cron('0 2 1 * *', async () => {
    logger.info('Start monthly cronjob');

    try {
      promCronCounter.inc({ period: 'monthly' });
      await Promise.all([
        checkFeedEventsNotify(FeedChannelNotifyFrequency.month),
      ]);

      logger.info('Monthly cronjob completed');
    } catch (err) {
      logger.error('Monthly cronjob error:', err);
    }
  });

  // TODO: add more cronjob

  logger.info('Daily job will start at:', dailyJob.nextRun()?.toISOString());
  logger.info('Weekly job will start at:', weeklyJob.nextRun()?.toISOString());
  logger.info(
    'Monthly job will start at:',
    monthlyJob.nextRun()?.toISOString()
  );

  if (env.clickhouse.enable) {
    const clickHouseSyncJob = initClickHouseSyncCronjob();

    logger.info(
      'Clickhouse sync job will start at:',
      clickHouseSyncJob.nextRun()?.toISOString()
    );
  }

  return { dailyJob, weeklyJob, monthlyJob };
}
