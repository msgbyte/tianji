import dayjs from 'dayjs';
import { logger } from '../utils/logger.js';
import { prisma } from '../model/_client.js';
import { sendNotification } from '../model/notification/index.js';
import { token } from '../model/notification/token/index.js';

/**
 * Check AI Gateway quota alerts and send notifications if daily quota is exceeded
 */
export async function checkAIGatewayQuotaAlerts() {
  logger.info(
    '[checkAIGatewayQuotaAlerts] Start checking AI Gateway quota alerts'
  );

  try {
    // Get all enabled quota alerts
    const quotaAlerts = await prisma.aIGatewayQuotaAlert.findMany({
      where: {
        enabled: true,
      },
      include: {
        gateway: true,
        notification: true,
      },
    });

    logger.info(
      `[checkAIGatewayQuotaAlerts] Found ${quotaAlerts.length} enabled quota alerts`
    );

    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    for (const quotaAlert of quotaAlerts) {
      try {
        // Calculate today's total cost for this gateway
        const todayCost = await prisma.aIGatewayLogs.aggregate({
          where: {
            gatewayId: quotaAlert.gatewayId,
            workspaceId: quotaAlert.workspaceId,
            status: 'Success',
            createdAt: {
              gte: today.toDate(),
              lt: tomorrow.toDate(),
            },
          },
          _sum: {
            price: true,
          },
        });

        const totalCost = Number(todayCost._sum.price || 0);
        const dailyQuota = Number(quotaAlert.dailyQuota);

        logger.info(
          `[checkAIGatewayQuotaAlerts] Gateway ${quotaAlert.gatewayId}: cost=${totalCost}, quota=${dailyQuota}`
        );

        // Check if quota is exceeded
        if (totalCost >= dailyQuota && dailyQuota > 0) {
          // Check if we already sent an alert today
          const lastAlertSent = quotaAlert.lastAlertSentAt
            ? dayjs(quotaAlert.lastAlertSentAt).isSame(today, 'day')
            : false;

          if (!lastAlertSent && quotaAlert.notification) {
            logger.info(
              `[checkAIGatewayQuotaAlerts] Sending quota alert for gateway ${quotaAlert.gatewayId}`
            );

            // Send notification
            await sendNotification(
              {
                name: quotaAlert.notification.name,
                type: quotaAlert.notification.type,
                payload: quotaAlert.notification.payload,
              },
              `AI Gateway 额度告警 - ${quotaAlert.gateway.name}`,
              [
                token.title(`AI Gateway 额度告警`, 2),
                token.text(`Gateway: ${quotaAlert.gateway.name}`),
                token.newline(),
                token.text(`今日使用成本: $${totalCost.toFixed(4)}`),
                token.text(`设置额度: $${dailyQuota.toFixed(4)}`),
                token.newline(),
                token.text(
                  `告警时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
                ),
                token.newline(),
                token.text('请及时检查 AI Gateway 使用情况，避免超出预算。'),
              ],
              {
                gatewayId: quotaAlert.gatewayId,
                gatewayName: quotaAlert.gateway.name,
                dailyCost: totalCost,
                dailyQuota,
                alertTime: dayjs().toISOString(),
              }
            );

            // Update last alert sent time
            await prisma.aIGatewayQuotaAlert.update({
              where: {
                id: quotaAlert.id,
              },
              data: {
                lastAlertSentAt: new Date(),
              },
            });

            logger.info(
              `[checkAIGatewayQuotaAlerts] Quota alert sent for gateway ${quotaAlert.gatewayId}`
            );
          } else if (lastAlertSent) {
            logger.info(
              `[checkAIGatewayQuotaAlerts] Alert already sent today for gateway ${quotaAlert.gatewayId}`
            );
          } else {
            logger.warn(
              `[checkAIGatewayQuotaAlerts] No notification configured for gateway ${quotaAlert.gatewayId}`
            );
          }
        }
      } catch (error) {
        logger.error(
          `[checkAIGatewayQuotaAlerts] Error processing quota alert for gateway ${quotaAlert.gatewayId}:`,
          error
        );
      }
    }

    logger.info(
      '[checkAIGatewayQuotaAlerts] Completed checking AI Gateway quota alerts'
    );
  } catch (error) {
    logger.error(
      '[checkAIGatewayQuotaAlerts] Error checking quota alerts:',
      error
    );
  }
}
