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

// Shared validation schema for event payload
const eventPayloadSchema = yup.object().shape({
  data: yup.object(),
  language: yup.string().max(35),
  os: yup.string().max(20),
  application: yup.string().required(),
  name: yup.string().max(50),
  screen: yup.string().max(500),
  params: yup.object(),
});

// Shared function to process a single event
async function processEvent(type: string, payload: any, session: any) {
  const {
    name: eventName,
    data: eventData,
    screen: screenName,
    params: screenParams,
  } = payload;

  if (type === COLLECTION_TYPE.event) {
    await saveApplicationEvent({
      eventName,
      eventData,
      screenName,
      screenParams,
      ...session,
      sessionId: session.id,
    });
    return { status: 'success', type: 'event' };
  }

  if (type === COLLECTION_TYPE.identify) {
    if (!eventData) {
      throw new Error('Data required for identify event');
    }

    await saveApplicationSessionData({
      ...session,
      sessionData: eventData,
      sessionId: session.id,
    });
    return { status: 'success', type: 'identify' };
  }

  throw new Error(`Unsupported event type: ${type}`);
}

applicationRouter.post(
  '/send',
  validate(
    body('payload')
      .exists()
      .withMessage('payload should be existed')
      .isObject()
      .custom(async (input) => {
        return eventPayloadSchema.required().validate(input);
      }),
    body('type')
      .exists()
      .withMessage('type should be existed')
      .isString()
      .matches(/event|identify/i)
  ),
  async (req, res) => {
    const { type, payload } = req.body;

    const session = await findSession(req, req.body);

    if (await isWorkspacePaused(session.workspaceId)) {
      res.status(403).send('Workspace is paused.');
      return;
    }

    try {
      await processEvent(type, payload, session);
      const token = createToken(session);
      res.send(token);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

applicationRouter.post(
  '/batch',
  validate(
    body('events')
      .exists()
      .withMessage('events should be existed')
      .isArray({ min: 1, max: 100 })
      .withMessage('events should be an array with 1-100 items')
      .custom(async (events) => {
        // Validate each event in the array
        const eventSchema = yup.object().shape({
          type: yup
            .string()
            .required()
            .matches(/event|identify/i),
          payload: eventPayloadSchema.required(),
        });

        for (const event of events) {
          await eventSchema.validate(event);
        }
        return true;
      })
  ),
  async (req, res) => {
    const { events } = req.body;

    const session = await findSession(req, events[0]);

    if (await isWorkspacePaused(session.workspaceId)) {
      res.status(403).send('Workspace is paused.');
      return;
    }

    const results = [];
    const errors = [];

    // Process each event in the batch
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      try {
        const result = await processEvent(event.type, event.payload, session);
        results.push({ index: i, ...result });
      } catch (error) {
        errors.push({
          index: i,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const token = createToken(session);

    res.json({
      token,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  }
);
