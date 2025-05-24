import { Router } from 'express';
import { param, validate, query } from '../middleware/validate.js';
import { prisma } from '../model/_client.js';
import { logger } from '../utils/logger.js';
import dayjs from 'dayjs';
import { updateMonitorErrorMessage } from '../model/monitor/index.js';
import { subscribeEventBus } from '../ws/shared.js';
import { saveMonitorStatus } from '../model/monitor/provider/_utils.js';

export const pushRouter = Router();

// 通过推送令牌处理外部推送请求
pushRouter.all(
  '/:pushToken',
  validate(
    param('pushToken').isString(),
    query('msg').optional().isString(),
    query('status').optional().isString(),
    query('value').optional().isString()
  ),
  async (req, res) => {
    try {
      const { pushToken } = req.params;
      const msg = req.query.msg || 'OK';
      const statusFromParam = req.query.status === 'down' ? 'DOWN' : 'UP';

      const monitor = await prisma.monitor.findFirst({
        where: {
          payload: {
            path: ['pushToken'],
            equals: pushToken,
          },
          active: true,
        },
        include: {
          notifications: true,
        },
      });

      if (!monitor) {
        throw new Error('Monitor not found or not active');
      }

      const value =
        statusFromParam === 'UP' ? Number(req.query.value || 1) : -1;
      const data = await prisma.monitorData.create({
        data: {
          monitorId: monitor.id,
          value,
        },
      });

      await saveMonitorStatus(monitor.id, 'lastPush', {
        lastPushTime: dayjs().toISOString(),
        lastMessage: msg,
      });

      if (statusFromParam === 'UP') {
        await updateMonitorErrorMessage(monitor.id, '');
      } else {
        await updateMonitorErrorMessage(monitor.id, String(msg));
      }

      subscribeEventBus.emit(
        'onMonitorReceiveNewData',
        monitor.workspaceId,
        data
      );

      res.json({
        ok: true,
        message: 'Push received successfully',
      });
    } catch (err) {
      logger.error('[Push] Error processing push request:', String(err));
      res.status(404).json({
        ok: false,
        error: String(err),
      });
    }
  }
);
