import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, param, query, validate } from '../middleware/validate';
import {
  addWorkspaceWebsite,
  checkIsWorkspaceUser,
  getWorkspaceWebsites,
} from '../model/workspace';

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
  async (req, res) => {
    const userId = req.user!.id;
    const workspaceId = req.query.workspaceId as string;

    const isWorkspaceUser = await checkIsWorkspaceUser(workspaceId, userId);

    if (!isWorkspaceUser) {
      throw new Error('Is not workspace user');
    }

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
  async (req, res) => {
    const userId = req.user!.id;
    const { workspaceId, name, domain } = req.body;

    const isWorkspaceUser = await checkIsWorkspaceUser(workspaceId, userId);

    if (!isWorkspaceUser) {
      throw new Error('Is not workspace user');
    }

    const website = await addWorkspaceWebsite(workspaceId, name, domain);

    res.json({ website });
  }
);
