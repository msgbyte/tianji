import { Router } from 'express';
import { numify } from '../utils/common';
const openBadge = require('openbadge');

export const telemetryRouter = Router();

telemetryRouter.get('/blank.gif', async (req, res) => {
  const buffer = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.header('Content-Type', 'image/gif').send(buffer);
});

telemetryRouter.get('/badge.svg', async (req, res) => {
  const title = req.query.title || 'visitor';

  const num = numify(11123243);

  const svg = await new Promise((resolve, reject) => {
    openBadge(
      {
        text: [title, num],
      },
      (err: any, badgeSvg: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(badgeSvg);
        }
      }
    );
  });

  res.header('Content-Type', 'image/svg+xml').send(svg);
});
