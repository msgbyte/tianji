import { Router } from 'express';
import { auth } from '../middleware/auth';
import { param, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import { deleteWorkspaceWebsite } from '../model/workspace';
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
