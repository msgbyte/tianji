import { Router } from 'express';
import { auth } from '../middleware/auth';
import { body, param, validate } from '../middleware/validate';
import { workspacePermission } from '../middleware/workspace';
import {
  createWorkspaceNotification,
  getWorkspaceNotifications,
} from '../model/notification';
import { ROLES } from '../utils/const';

export const notificationRouter = Router();

notificationRouter.get(
  '/list',
  validate(param('workspaceId').isUUID()),
  auth(),
  workspacePermission(),
  async (req, res) => {
    const list = await getWorkspaceNotifications(req.params.workspaceId);

    res.json({ list });
  }
);

notificationRouter.post(
  '/create',
  validate(
    param('workspaceId').isUUID(),
    body('name').isString(),
    body('type').isString(),
    body('payload').isObject()
  ),
  auth(),
  workspacePermission([ROLES.owner]),
  async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const { name, type, payload } = req.body;
    const notification = await createWorkspaceNotification(
      workspaceId,
      name,
      type,
      payload
    );

    res.json({ notification });
  }
);
