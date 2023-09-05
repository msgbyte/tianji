import { Handler } from 'express';
import { checkIsWorkspaceUser } from '../model/workspace';

export function workspacePermission(): Handler {
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

    const isWorkspaceUser = await checkIsWorkspaceUser(workspaceId, userId);

    if (!isWorkspaceUser) {
      throw new Error('Is not workspace user');
    }

    next();
  };
}
