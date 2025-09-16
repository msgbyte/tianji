import { prisma } from '../_client.js';
import { sendNotification } from '../notification/index.js';
import { token } from '../notification/token/index.js';
import { logger } from '../../utils/logger.js';
import { buildQueryWithCache, getCacheManager } from '../../cache/index.js';
import { withDistributedLock } from '../../cache/distributedLock.js';
import dayjs from 'dayjs';

/**
 * Generate daily cost cache key
 */
function getDailyCostCacheKey(
  workspaceId: string,
  gatewayId: string,
  date?: string | dayjs.Dayjs
): string {
  const dateStr = date
    ? dayjs(date).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD');
  return `ai-gateway-daily-cost:${workspaceId}:${gatewayId}:${dateStr}`;
}

export interface QuotaAlertLevel {
  percentage: number;
  level: '80' | '100' | '150';
  field: 'alertLevel80Sent' | 'alertLevel100Sent' | 'alertLevel150Sent';
  title: string;
  color: string;
}

export const QUOTA_ALERT_LEVELS: QuotaAlertLevel[] = [
  {
    percentage: 80,
    level: '80',
    field: 'alertLevel80Sent',
    title: 'AI Gateway Quota Alert - 80%',
    color: 'yellow',
  },
  {
    percentage: 100,
    level: '100',
    field: 'alertLevel100Sent',
    title: 'AI Gateway Quota Alert - 100%',
    color: 'orange',
  },
  {
    percentage: 150,
    level: '150',
    field: 'alertLevel150Sent',
    title: 'AI Gateway Quota Alert - 150%',
    color: 'red',
  },
];

// Cache for quota alert settings (5 minutes TTL)
const {
  get: getQuotaAlertCache,
  del: clearQuotaAlertCache,
  update: updateQuotaAlertCache,
} = buildQueryWithCache(async (workspaceId: string, gatewayId: string) => {
  return await prisma.aIGatewayQuotaAlert.findFirst({
    where: {
      workspaceId,
      gatewayId,
      enabled: true,
    },
    include: {
      aiGateway: true,
      notification: true,
    },
  });
});

/**
 * Clear quota alert cache for a specific gateway
 */
export function clearQuotaAlertCacheForGateway(
  workspaceId: string,
  gatewayId: string
) {
  clearQuotaAlertCache(workspaceId, gatewayId);
}

/**
 * Get daily cost from cache or calculate if not cached
 */
async function getDailyCost(
  workspaceId: string,
  gatewayId: string
): Promise<number> {
  const cacheKey = getDailyCostCacheKey(workspaceId, gatewayId);
  const cacheManager = await getCacheManager();

  // Try to get from cache first
  const cachedCost = await cacheManager.get(cacheKey);
  if (cachedCost !== undefined) {
    return Number(cachedCost);
  }

  // Calculate fresh value
  const todayStart = dayjs().startOf('day');
  const tomorrowStart = dayjs().add(1, 'day').startOf('day');

  const todayCost = await prisma.aIGatewayLogs.aggregate({
    where: {
      gatewayId,
      workspaceId,
      status: 'Success',
      createdAt: {
        gte: todayStart.toDate(),
        lt: tomorrowStart.toDate(),
      },
    },
    _sum: {
      price: true,
    },
  });

  const totalCost = Number(todayCost._sum.price || 0);

  // Cache for 5 minutes
  await cacheManager.set(cacheKey, totalCost, 5 * 60 * 1000);

  return totalCost;
}

/**
 * Update daily cost cache after a new request
 */
async function updateDailyCostCache(
  workspaceId: string,
  gatewayId: string,
  additionalCost: number
): Promise<void> {
  const cacheKey = getDailyCostCacheKey(workspaceId, gatewayId);
  const cacheManager = await getCacheManager();

  // Get current cached value
  const cachedCost = await cacheManager.get(cacheKey);
  if (cachedCost !== undefined) {
    // Update cache with new total
    const newTotal = Number(cachedCost) + additionalCost;
    await cacheManager.set(cacheKey, newTotal, 5 * 60 * 1000);
  }
  // If not cached, it will be calculated fresh next time
}

/**
 * Check and send quota alerts for a specific gateway
 * This function should be called after each AI Gateway request
 */
export async function checkQuotaAlert(
  workspaceId: string,
  gatewayId: string,
  requestCost?: number
): Promise<void> {
  try {
    // Get quota alert settings from cache
    const quotaAlert = await getQuotaAlertCache(workspaceId, gatewayId);

    if (
      !quotaAlert ||
      !quotaAlert.notificationId ||
      Number(quotaAlert.dailyQuota) <= 0
    ) {
      return;
    }

    // Update daily cost cache if requestCost is provided
    if (requestCost !== undefined && requestCost > 0) {
      await updateDailyCostCache(workspaceId, gatewayId, requestCost);
    }

    // Get today's total cost from cache
    const totalCost = await getDailyCost(workspaceId, gatewayId);
    const dailyQuota = Number(quotaAlert.dailyQuota);
    const percentage = (totalCost / dailyQuota) * 100;

    logger.info(
      `[checkQuotaAlert] Gateway ${gatewayId}: cost=${totalCost}, quota=${dailyQuota}, percentage=${percentage.toFixed(1)}%`
    );

    // Check each alert level
    for (const alertLevel of QUOTA_ALERT_LEVELS) {
      const shouldAlert = percentage >= alertLevel.percentage;
      const alreadySent = quotaAlert[alertLevel.field];

      if (shouldAlert && !alreadySent) {
        await withDistributedLock(
          `quota-alert-notification:${workspaceId}:${gatewayId}:${alertLevel.level}`,
          async () => {
            logger.info(
              `[checkQuotaAlert] Sending ${alertLevel.level}% alert for gateway ${gatewayId}`
            );

            // Send notification
            await sendNotification(
              {
                name: quotaAlert.notification?.name ?? '',
                type: quotaAlert.notification?.type ?? '',
                payload: quotaAlert.notification?.payload ?? {},
              },
              `${alertLevel.title} - ${quotaAlert.aiGateway.name}`,
              [
                token.paragraph(`Gateway: ${quotaAlert.aiGateway.name}`),
                token.text(`Today's Usage Cost: $${totalCost.toFixed(4)}`),
                token.newline(),
                token.text(`Quota Set: $${dailyQuota.toFixed(4)}`),
                token.newline(),
                token.text(`Usage Percentage: ${percentage.toFixed(1)}%`),
                token.newline(),
                token.paragraph(
                  `Alert Time: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
                ),
                token.paragraph(getAlertMessage(alertLevel.level, percentage)),
              ],
              {
                gatewayId: quotaAlert.gatewayId,
                gatewayName: quotaAlert.aiGateway.name,
                dailyCost: totalCost,
                dailyQuota,
                percentage,
                alertLevel: alertLevel.level,
                alertTime: dayjs().toISOString(),
              }
            );

            // local update quota alert cache to avoid high concurrency issue
            await updateQuotaAlertCache(
              workspaceId,
              gatewayId
            )({
              ...quotaAlert,
              [alertLevel.field]: true,
              lastAlertSentAt: new Date(),
            });

            // Update alert sent status
            await prisma.aIGatewayQuotaAlert.update({
              where: {
                id: quotaAlert.id,
              },
              data: {
                [alertLevel.field]: true,
                lastAlertSentAt: new Date(),
              },
            });

            // Clear cache after updating alert status
            clearQuotaAlertCache(workspaceId, gatewayId);

            logger.info(
              `[checkQuotaAlert] ${alertLevel.level}% alert sent for gateway ${gatewayId}`
            );
          },
          {
            timeout: 30_000, // 30 seconds timeout
            skipOnFailure: true, // Skip if another process is already sending the alert
          }
        );
      }
    }
  } catch (error) {
    logger.error(
      `[checkQuotaAlert] Error checking quota alert for gateway ${gatewayId}:`,
      error
    );
  }
}

/**
 * Reset daily alert flags (should be called at the start of each day)
 */
export async function resetDailyAlertFlags(): Promise<void> {
  try {
    // Get all enabled quota alerts to clear their caches
    const quotaAlerts = await prisma.aIGatewayQuotaAlert.findMany({
      where: {
        enabled: true,
      },
      select: {
        workspaceId: true,
        gatewayId: true,
      },
    });

    // Reset alert flags
    await prisma.aIGatewayQuotaAlert.updateMany({
      where: {
        enabled: true,
      },
      data: {
        alertLevel80Sent: false,
        alertLevel100Sent: false,
        alertLevel150Sent: false,
      },
    });

    // Clear quota alert caches
    for (const alert of quotaAlerts) {
      clearQuotaAlertCache(alert.workspaceId, alert.gatewayId);
    }

    // Clear daily cost caches for yesterday and today
    const cacheManager = await getCacheManager();
    const today = dayjs();
    const yesterday = dayjs().subtract(1, 'day');

    for (const alert of quotaAlerts) {
      const todayCacheKey = getDailyCostCacheKey(
        alert.workspaceId,
        alert.gatewayId,
        today
      );
      const yesterdayCacheKey = getDailyCostCacheKey(
        alert.workspaceId,
        alert.gatewayId,
        yesterday
      );

      await cacheManager.delete(todayCacheKey);
      await cacheManager.delete(yesterdayCacheKey);
    }

    logger.info(
      '[resetDailyAlertFlags] Daily alert flags reset and caches cleared'
    );
  } catch (error) {
    logger.error('[resetDailyAlertFlags] Error resetting alert flags:', error);
  }
}

// Returns an English alert message for AI Gateway quota usage based on the alert level
function getAlertMessage(level: string, percentage: number): string {
  switch (level) {
    case '80':
      return '⚠️ Your AI Gateway usage has reached 80% of the quota. Please monitor your usage.';
    case '100':
      return '🚨 Your AI Gateway usage has reached 100% of the quota. Please check your usage immediately.';
    case '150':
      return '🔥 Your AI Gateway usage has exceeded 150% of the quota. Please take immediate action to control costs!';
    default:
      return 'Please check your AI Gateway usage in time to avoid exceeding your budget.';
  }
}
