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
import { resetDailyAlertFlags } from '../model/aiGateway/quotaAlert.js';
import { checkFeedEventsNotify } from './shared.js';
import { promCronCounter } from '../utils/prometheus/client.js';
import { initClickHouseSyncCronjob } from '../clickhouse/cronjob.js';
import { withDistributedLock } from '../cache/index.js';

export function initCronjob() {
  const dailyJob = Cron('0 2 * * *', async () => {
    const result = await withDistributedLock(
      'tianji-daily-cronjob',
      async () => {
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
            resetDailyAlertFlags().catch(logger.error),
          ]);

          if (env.billing.enable) {
            await checkWorkspaceUsage();
          }

          logger.info('Daily cronjob completed');
          return true;
        } catch (err) {
          logger.error('Daily cronjob error:', err);
          throw err;
        }
      },
      {
        timeout: 10 * 60 * 1000,
        skipOnFailure: true,
      }
    );

    if (result === null) {
      logger.info(
        'Daily cronjob skipped - already running on another instance'
      );
    }
  });

  const weeklyJob = Cron('0 2 * * 1', async () => {
    const result = await withDistributedLock(
      'tianji-weekly-cronjob',
      async () => {
        logger.info('Start weekly cronjob');

        try {
          promCronCounter.inc({ period: 'weekly' });
          await Promise.all([
            checkFeedEventsNotify(FeedChannelNotifyFrequency.week),
          ]);

          logger.info('Weekly cronjob completed');
          return true;
        } catch (err) {
          logger.error('Weekly cronjob error:', err);
          throw err;
        }
      },
      {
        timeout: 5 * 60 * 1000, // 5 minutes timeout for weekly job
        skipOnFailure: true,
      }
    );

    if (result === null) {
      logger.info(
        'Weekly cronjob skipped - already running on another instance'
      );
    }
  });

  const monthlyJob = Cron('0 2 1 * *', async () => {
    const result = await withDistributedLock(
      'tianji-monthly-cronjob',
      async () => {
        logger.info('Start monthly cronjob');

        try {
          promCronCounter.inc({ period: 'monthly' });
          await Promise.all([
            checkFeedEventsNotify(FeedChannelNotifyFrequency.month),
          ]);

          logger.info('Monthly cronjob completed');
          return true;
        } catch (err) {
          logger.error('Monthly cronjob error:', err);
          throw err;
        }
      },
      {
        timeout: 5 * 60 * 1000, // 5 minutes timeout for monthly job
        skipOnFailure: true,
      }
    );

    if (result === null) {
      logger.info(
        'Monthly cronjob skipped - already running on another instance'
      );
    }
  });

  // TODO: add more cronjob

  logger.info('Daily job will start at:', dailyJob.nextRun()?.toISOString());
  logger.info('Weekly job will start at:', weeklyJob.nextRun()?.toISOString());
  logger.info(
    'Monthly job will start at:',
    monthlyJob.nextRun()?.toISOString()
  );

  if (env.clickhouse.enable && env.clickhouse.sync.enable) {
    const clickHouseSyncJob = initClickHouseSyncCronjob();

    logger.info(
      'Clickhouse sync job will start at:',
      clickHouseSyncJob.nextRun()?.toISOString()
    );
  }

  return { dailyJob, weeklyJob, monthlyJob };
}
