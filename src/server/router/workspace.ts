import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, param, query, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import {
  addWorkspaceWebsite,
  deleteWorkspaceWebsite,
  getWorkspaceWebsiteInfo,
  getWorkspaceWebsitePageviewStats,
  getWorkspaceWebsites,
  updateWorkspaceWebsiteInfo,
} from '../model/workspace';
import { parseDateRange } from '../utils/common';
import { ROLES } from '../utils/const';
import { QueryFilters } from '../utils/prisma';

export const workspaceRouter = Router();

workspaceRouter.get(
  '/websites',
  validate(
    query('workspaceId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID')
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
    body('workspaceId').isUUID().withMessage('workspaceId should be UUID'),
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

workspaceRouter.get(
  '/website/:websiteId',
  validate(
    query('workspaceId').isUUID().withMessage('workspaceId should be UUID'),
    param('websiteId').isUUID().withMessage('workspaceId should be UUID')
  ),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const workspaceId = req.query.workspaceId as string;
    const websiteId = req.params.websiteId;

    const website = await getWorkspaceWebsiteInfo(workspaceId, websiteId);

    res.json({ website });
  }
);

workspaceRouter.post(
  '/website/:websiteId',
  validate(
    body('workspaceId').isUUID().withMessage('workspaceId should be UUID'),
    param('websiteId')
      .isString()
      .isUUID()
      .withMessage('workspaceId should be UUID'),
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
    const workspaceId = req.query.workspaceId as string;
    const websiteId = req.params.websiteId;
    const { name, domain } = req.body;

    const website = await updateWorkspaceWebsiteInfo(
      workspaceId,
      websiteId,
      name,
      domain
    );

    res.json({ website });
  }
);

workspaceRouter.delete(
  '/:workspaceId/website/:websiteId',
  validate(
    param('workspaceId').isUUID().withMessage('workspaceId should be UUID'),
    param('websiteId').isUUID().withMessage('workspaceId should be UUID')
  ),
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
    param('workspaceId').isUUID().withMessage('workspaceId should be UUID'),
    param('websiteId').isUUID().withMessage('workspaceId should be UUID')
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

    const website = await getWorkspaceWebsitePageviewStats(
      websiteId,
      filters as QueryFilters
    );

    res.json({ website });
  }
);
