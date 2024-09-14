import { Router } from 'express';
import { param, validate } from '../middleware/validate.js';
import { prisma } from '../model/_client.js';
import { getLighthouseReport } from '../utils/screenshot/lighthouse.js';

export const lighthouseRouter = Router();

lighthouseRouter.get(
  '/:lighthouseId',
  validate(param('lighthouseId').isString()),
  async (req, res) => {
    const { lighthouseId } = req.params;

    const { result } = await prisma.websiteLighthouseReport.findUniqueOrThrow({
      where: {
        id: lighthouseId,
      },
      select: {
        result: true,
      },
    });

    res.setHeader('Content-Type', 'application/json').send(JSON.parse(result));
  }
);

lighthouseRouter.get(
  '/:lighthouseId/html',
  validate(param('lighthouseId').isString()),
  async (req, res) => {
    const { lighthouseId } = req.params;

    const { result } = await prisma.websiteLighthouseReport.findUniqueOrThrow({
      where: {
        id: lighthouseId,
      },
      select: {
        result: true,
      },
    });

    res
      .setHeader('Content-Type', 'text/html')
      .send(getLighthouseReport(JSON.parse(result)));
  }
);
