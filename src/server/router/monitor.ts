import { Router } from 'express';
import { param, validate, query } from '../middleware/validate';
import { numify } from '../utils/common';
import { makeBadge } from 'badge-maker';
import { getMonitorPublicInfos, getMonitorRecentData } from '../model/monitor';
import { checkEnvTrusty } from '../utils/env';

export const monitorRouter = Router();

monitorRouter.get(
  '/:workspaceId/:monitorId/badge.svg',
  validate(
    param('workspaceId').isString(),
    param('monitorId').isString(),
    query('showDetail').optional().isString()
  ),
  async (req, res) => {
    const { workspaceId, monitorId } = req.params;
    const showDetail = checkEnvTrusty(String(req.query.showDetail));

    const [info] = await getMonitorPublicInfos([monitorId]);
    const [{ value }] = await getMonitorRecentData(workspaceId, monitorId, 1);

    const svg =
      value >= 0
        ? makeBadge({
            label: info.name,
            message: showDetail ? numify(value) : 'Health',
            color: 'green',
          })
        : makeBadge({
            label: info.name,
            message: 'Error',
            color: 'red',
          });

    res.header('Content-Type', 'image/svg+xml').send(svg);
  }
);
