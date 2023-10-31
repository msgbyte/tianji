import { Router } from 'express';
import { body, header, validate } from '../middleware/validate';
import { recordServerStatus } from '../model/serverStatus';

export const serverStatusRouter = Router();

serverStatusRouter.post(
  '/report',
  validate(
    header('x-tianji-report-version').isSemVer(),
    body('workspaceId').isString(),
    body('name').isString(),
    body('hostname').isString(),
    body('timeout').optional().isInt(),
    body('payload').isObject()
  ),
  async (req, res) => {
    const body = req.body;

    recordServerStatus(body);

    res.send('success');
  }
);
