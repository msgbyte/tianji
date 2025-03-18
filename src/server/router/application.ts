import { Router } from 'express';
import { body, validate } from '../middleware/validate.js';
import * as yup from 'yup';
import { COLLECTION_TYPE } from '../utils/const.js';
import {
  findSession,
  saveApplicationEvent,
  saveApplicationSessionData,
} from '../model/application/index.js';
import { createToken } from '../utils/common.js';
import { isWorkspacePaused } from '../model/billing/workspace.js';

export const applicationRouter = Router();

applicationRouter.post(
  '/send',
  validate(
    body('payload')
      .exists()
      .withMessage('payload should be existed')
      .isObject()
      .custom(async (input) => {
        return yup
          .object()
          .shape({
            data: yup.object(),
            language: yup.string().max(35),
            os: yup.string().max(20),
            url: yup.string().max(500),
            application: yup.string().required(),
            name: yup.string().max(50),
          })
          .required()
          .validate(input);
      }),
    body('type')
      .exists()
      .withMessage('type should be existed')
      .isString()
      .matches(/event|identify/i)
  ),
  async (req, res) => {
    const { type, payload } = req.body;
    const { url, name: eventName, data: eventData } = payload;

    const session = await findSession(req);

    if (await isWorkspacePaused(session.workspaceId)) {
      res.status(403).send('Workspace is paused.');
      return;
    }

    if (type === COLLECTION_TYPE.event) {
      await saveApplicationEvent({
        url,
        eventName,
        eventData,
        ...session,
        sessionId: session.id,
      });
    }

    if (type === COLLECTION_TYPE.identify) {
      if (!eventData) {
        throw new Error('Data required');
      }

      await saveApplicationSessionData({
        ...session,
        sessionData: eventData,
        sessionId: session.id,
      });
    }

    const token = createToken(session);

    res.send(token);
  }
);
