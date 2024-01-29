import dayjs from 'dayjs';
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, param, query, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import {
  addWorkspaceWebsite,
  deleteWorkspaceWebsite,
  getWorkspaceWebsitePageview,
  getWorkspaceWebsites,
  getWorkspaceWebsiteSession,
  getWorkspaceWebsiteStats,
} from '../model/workspace';
import { parseDateRange } from '../utils/common';
import { QueryFilters } from '../utils/prisma';
import { ROLES } from '@tianji/shared';

export const workspaceRouter = Router();

workspaceRouter.delete(
  '/:workspaceId/website/:websiteId',
  validate(param('workspaceId').isString(), param('websiteId').isString()),
  auth(),
  workspacePermission([ROLES.owner]),
  async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const websiteId = req.params.websiteId;

    const website = await deleteWorkspaceWebsite(workspaceId, websiteId);

    res.json({ website });
  }
);

workspaceRouter.get(
  '/:workspaceId/website/:websiteId/pageviews',
  validate(
    param('workspaceId').isString(),
    param('websiteId').isString(),
    query('startAt').isNumeric().withMessage('startAt should be number'),
    query('endAt').isNumeric().withMessage('startAt should be number')
  ),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const websiteId = req.params.websiteId;
    const {
      timezone,
      url,
      referrer,
      title,
      os,
      browser,
      device,
      country,
      region,
      city,
      startAt,
      endAt,
    } = req.query;

    const { startDate, endDate, unit } = await parseDateRange({
      websiteId,
      startAt: Number(startAt),
      endAt: Number(endAt),
      unit: String(req.query.unit),
    });

    const filters = {
      startDate,
      endDate,
      timezone,
      unit,
      url,
      referrer,
      title,
      os,
      browser,
      device,
      country,
      region,
      city,
    };

    const [pageviews, sessions] = await Promise.all([
      getWorkspaceWebsitePageview(websiteId, filters as QueryFilters),
      getWorkspaceWebsiteSession(websiteId, filters as QueryFilters),
    ]);

    res.json({ pageviews, sessions });
  }
);
