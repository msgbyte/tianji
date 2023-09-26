import { Handler } from 'express';
import { getWorkspaceUser } from '../model/workspace';
import { ROLES } from '../utils/const';

export function workspacePermission(roles: ROLES[] = []): Handler {
  return async (req, res, next) => {
    const workspaceId =
      req.body.workspaceId ?? req.query.workspaceId ?? req.params.workspaceId;

    if (!workspaceId) {
      throw new Error('Cannot find workspace id');
    }

    const userId = req.user!.id;

    if (!userId) {
      throw new Error('This middleware should be use after auth()');
    }

    const info = await getWorkspaceUser(workspaceId, userId);

    if (!info) {
      throw new Error('Is not workspace user');
    }

    if (Array.isArray(roles) && roles.length > 0) {
      if (!roles.includes(info.role as ROLES)) {
        throw new Error(
          `Workspace roles not has this permission, need ${roles}`
        );
      }
    }

    next();
  };
}
