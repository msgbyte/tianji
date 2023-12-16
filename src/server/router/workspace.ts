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
import { ROLES } from '../../shared';

export const workspaceRouter = Router();

workspaceRouter.get(
  '/websites',
  validate(
    query('workspaceId').isString().withMessage('workspaceId should be string')
  ),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const workspaceId = req.query.workspaceId as string;

    const websites = await getWorkspaceWebsites(workspaceId);

    res.json({ websites });
  }
);

workspaceRouter.post(
  '/website',
  validate(
    body('workspaceId').isString(),
    body('name')
      .isString()
      .withMessage('name should be string')
      .isLength({ max: 100 })
      .withMessage('length should be under 100'),
    body('domain')
      .isURL()
      .withMessage('domain should be URL')
      .isLength({ max: 500 })
      .withMessage('length should be under 500')
  ),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const { workspaceId, name, domain } = req.body;

    const website = await addWorkspaceWebsite(workspaceId, name, domain);

    res.json({ website });
  }
);

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

workspaceRouter.get(
  '/:workspaceId/website/:websiteId/stats',
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

    const diff = dayjs(endDate).diff(startDate, 'minutes');
    const prevStartDate = dayjs(startDate).subtract(diff, 'minutes').toDate();
    const prevEndDate = dayjs(endDate).subtract(diff, 'minutes').toDate();

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
    } as QueryFilters;

    const [metrics, prevPeriod] = await Promise.all([
      getWorkspaceWebsiteStats(websiteId, {
        ...filters,
        startDate,
        endDate,
      }),
      getWorkspaceWebsiteStats(websiteId, {
        ...filters,
        startDate: prevStartDate,
        endDate: prevEndDate,
      }),
    ]);

    const stats = Object.keys(metrics[0]).reduce((obj, key) => {
      obj[key] = {
        value: Number(metrics[0][key]) || 0,
        change: Number(metrics[0][key]) - Number(prevPeriod[0][key]) || 0,
      };
      return obj;
    }, {} as Record<string, { value: number; change: number }>);

    res.json({ stats });
  }
);
