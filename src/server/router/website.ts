import { Router } from 'express';
import { body, validate } from '../middleware/validate.js';
import * as yup from 'yup';
import { COLLECTION_TYPE } from '../utils/const.js';
import {
  findSession,
  saveWebsiteEvent,
  saveWebsiteSessionData,
} from '../model/website/index.js';
import { createToken } from '../utils/common.js';
import { hostnameRegex } from '@tianji/shared';
import { isWorkspacePaused } from '../model/billing/workspace.js';
import { promWebsiteEventCounter } from '../utils/prometheus/client.js';

export const websiteRouter = Router();

// Shared validation schema for event payload
const eventPayloadSchema = yup.object().shape({
  data: yup.object(),
  hostname: yup.string().matches(hostnameRegex).max(100),
  language: yup.string().max(35),
  referrer: yup.string().max(500),
  screen: yup.string().max(11),
  title: yup.string().max(500),
  url: yup.string().max(500),
  website: yup.string().required(),
  name: yup.string().max(50),
});

// Shared function to process a single event
async function processEvent(type: string, payload: any, session: any) {
  const {
    url,
    referrer,
    name: eventName,
    data: eventData,
    title: pageTitle,
  } = payload;

  if (type === COLLECTION_TYPE.event) {
    let [urlPath, urlQuery] = url?.split('?') || [];
    let [referrerPath, referrerQuery] = referrer?.split('?') || [];
    let referrerDomain;

    if (!urlPath) {
      urlPath = '/';
    }

    if (referrerPath?.startsWith('http')) {
      const refUrl = new URL(referrer);
      referrerPath = refUrl.pathname;
      referrerQuery = refUrl.search.substring(1);
      referrerDomain = refUrl.hostname.replace(/www\./, '');
    }

    if (process.env.REMOVE_TRAILING_SLASH) {
      urlPath = urlPath.replace(/.+\/$/, '');
    }

    // Parse UTM parameters from URL query string
    let utmSource, utmMedium, utmCampaign, utmTerm, utmContent;
    if (urlQuery) {
      const params = new URLSearchParams(urlQuery);
      utmSource = params.get('utm_source') || undefined;
      utmMedium = params.get('utm_medium') || undefined;
      utmCampaign = params.get('utm_campaign') || undefined;
      utmTerm = params.get('utm_term') || undefined;
      utmContent = params.get('utm_content') || undefined;
    }

    saveWebsiteEvent({
      urlPath,
      urlQuery,
      referrerPath,
      referrerQuery,
      referrerDomain,
      pageTitle,
      eventName,
      eventData,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      ...session,
      sessionId: session.id,
    });
    return { status: 'success', type: 'event' };
  }

  if (type === COLLECTION_TYPE.identify) {
    if (!eventData) {
      throw new Error('Data required for identify event');
    }

    await saveWebsiteSessionData({
      ...session,
      sessionData: eventData,
      sessionId: session.id,
    });
    return { status: 'success', type: 'identify' };
  }

  throw new Error(`Unsupported event type: ${type}`);
}

websiteRouter.post(
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
    // Reference: https://github1s.com/umami-software/umami/blob/master/src/pages/api/send.ts

    const { type, payload } = req.body;

    const session = await findSession(req, req.body);

    if (await isWorkspacePaused(session.workspaceId)) {
      res.status(403).send('Workspace is paused.');
      return;
    }

    try {
      await processEvent(type, payload, session);
      const token = createToken(session);
      promWebsiteEventCounter.inc({
        websiteId: payload.website,
        eventType: type,
        endpoint: 'send',
      });
      res.send(token);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

websiteRouter.post(
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
        promWebsiteEventCounter.inc({
          websiteId: event.payload.website,
          eventType: event.type,
          endpoint: 'batch',
        });
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
