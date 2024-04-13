import { Router } from 'express';
import { query, validate } from '../middleware/validate';
import { recordTelemetryEvent, sumTelemetryEvent } from '../model/telemetry';
import { generateETag, numify } from '../utils/common';
import { makeBadge } from 'badge-maker';
import { env } from '../utils/env';

export const telemetryRouter = Router();

const blankGifBuffer = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * @deprecated please use route with telemetry id
 */
telemetryRouter.get(
  '/:workspaceId/blank.gif',
  validate(
    query('name').optional().isString(),
    query('url').optional().isURL()
  ),
  async (req, res) => {
    recordTelemetryEvent(req);

    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);

/**
 * @deprecated please use route with telemetry id
 */
telemetryRouter.get(
  '/:workspaceId/badge.svg',
  validate(
    query('name').optional().isString(),
    query('url').optional().isURL()
  ),
  async (req, res) => {
    const title = req.query.title || 'visitor';
    const start = req.query.start ? Number(req.query.start) : 0;

    recordTelemetryEvent(req);
    const num = await sumTelemetryEvent(req);

    const svg = makeBadge({
      label: String(title),
      message: numify(num + start),
      color: 'green',
    });

    res.header('Content-Type', 'image/svg+xml').send(svg);
  }
);

telemetryRouter.get(
  '/:workspaceId/:telemetryId.gif',
  validate(
    query('name').optional().isString(),
    query('url').optional().isURL(),
    query('force').optional().isBoolean()
  ),
  async (req, res) => {
    if (env.isTest) {
      await recordTelemetryEvent(req);
    } else {
      recordTelemetryEvent(req);
    }

    res
      .header('Content-Type', 'image/gif')
      .header(
        'Cache-Control',
        'no-cache,max-age=0,no-store,s-maxage=0,proxy-revalidate'
      )
      .status(200)
      .send(blankGifBuffer);
  }
);

telemetryRouter.get(
  '/:workspaceId/:telemetryId/badge.svg',
  validate(
    query('name').optional().isString(),
    query('url').optional().isURL(),
    query('title').optional().isString(),
    query('start').optional().isNumeric(),
    query('fullNum').optional().isBoolean(),
    query('force').optional().isBoolean()
  ),
  async (req, res) => {
    const title = req.query.title || 'visitor';
    const start = req.query.start ? Number(req.query.start) : 0;
    const fullNum = req.query.fullNum === 'true';

    if (env.isTest) {
      await recordTelemetryEvent(req);
    } else {
      recordTelemetryEvent(req);
    }
    const num = await sumTelemetryEvent(req);
    const count = num + start;

    const svg = makeBadge({
      label: String(title),
      message: fullNum ? String(count) : numify(count),
      color: 'green',
    });

    res
      .header('Content-Type', 'image/svg+xml')
      .header(
        'Cache-Control',
        'no-cache,max-age=0,no-store,s-maxage=0,proxy-revalidate'
      )
      .header('etag', generateETag(`${title}|${count}`))
      .status(200)
      .send(svg);
  }
);
