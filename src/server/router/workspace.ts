import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, param, query, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import {
  addWorkspaceWebsite,
  deleteWorkspaceWebsite,
  getWorkspaceWebsiteInfo,
  getWorkspaceWebsites,
  updateWorkspaceWebsiteInfo,
} from '../model/workspace';
import { ROLES } from '../utils/const';

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
    body('workspaceId')
      .isString()
      .withMessage('workspaceId should be string')
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
    const { workspaceId, name, domain } = req.body;

    const website = await addWorkspaceWebsite(workspaceId, name, domain);

    res.json({ website });
  }
);

workspaceRouter.get(
  '/website/:websiteId',
  validate(
    query('workspaceId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID'),
    param('websiteId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID')
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
    body('workspaceId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID'),
    param('websiteId')
      .isString()
      .withMessage('workspaceId should be string')
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
    param('workspaceId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID'),
    param('websiteId')
      .isString()
      .withMessage('workspaceId should be string')
      .isUUID()
      .withMessage('workspaceId should be UUID')
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
