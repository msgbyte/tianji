import { Router } from 'express';
import { body, validate } from '../middleware/validate';
import * as yup from 'yup';
import { COLLECTION_TYPE, HOSTNAME_REGEX } from '../utils/const';
import {
  findSession,
  saveWebsiteEvent,
  saveWebsiteSessionData,
} from '../model/website';
import { createToken } from '../utils/common';

export const websiteRouter = Router();

websiteRouter.post(
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
            hostname: yup.string().matches(HOSTNAME_REGEX).max(100),
            language: yup.string().max(35),
            referrer: yup.string().max(500),
            screen: yup.string().max(11),
            title: yup.string().max(500),
            url: yup.string().max(500),
            website: yup.string().uuid().required(),
            name: yup.string().max(50),
          })
          .required()
          .validate(input)
          .catch((err) => {});
      }),
    body('type')
      .exists()
      .withMessage('type should be existed')
      .isString()
      .matches(/event|identify/i)
  ),
  async (req, res) => {
    // https://github1s.com/umami-software/umami/blob/master/src/pages/api/send.ts

    const { type, payload } = req.body;
    const {
      url,
      referrer,
      name: eventName,
      data: eventData,
      title: pageTitle,
    } = payload;

    const session = await findSession(req);

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

      await saveWebsiteEvent({
        urlPath,
        urlQuery,
        referrerPath,
        referrerQuery,
        referrerDomain,
        pageTitle,
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

      await saveWebsiteSessionData({
        ...session,
        sessionData: eventData,
        sessionId: session.id,
      });
    }

    const token = createToken(session);

    res.send(token);
  }
);
