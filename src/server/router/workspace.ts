import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { param, validate } from '../middleware/validate.js';
import { workspacePermission } from '../middleware/workspace.js';
import { deleteWorkspaceWebsite } from '../model/workspace.js';
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
