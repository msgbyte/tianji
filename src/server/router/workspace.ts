import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, query, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import { addWorkspaceWebsite, getWorkspaceWebsites } from '../model/workspace';

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
    body('name').isString().withMessage('name should be a string'),
    body('domain').isURL().withMessage('domain should be URL')
  ),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const { workspaceId, name, domain } = req.body;

    const website = await addWorkspaceWebsite(workspaceId, name, domain);

    res.json({ website });
  }
);
