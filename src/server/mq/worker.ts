import zmq from 'zeromq';
import { zmqUrl } from './shared.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { generateLighthouse } from '../utils/screenshot/lighthouse.js';
import { get } from 'lodash-es';
import { prisma } from '../model/_client.js';
import { WebsiteLighthouseReportStatus } from '@prisma/client';
import { subscribeEventBus } from '../ws/shared.js';

export async function runMQWorker() {
  const sock = new zmq.Pull();
  sock.connect(zmqUrl);

  logger.info('Worker connected to:', zmqUrl);

  for await (const [_type, _msg] of sock) {
    const type = String(_type);
    const msg = String(_msg);
    logger.info('Received message', type, msg);

    try {
      if (type === 'lighthouse') {
        await runLighthouseReportWorker(msg);
      }
    } catch (err) {
      logger.error('MQ Worker throw error', { type, msg }, err);
    }
  }
}

async function runLighthouseReportWorker(msg: string) {
  const payload = z
    .object({
      workspaceId: z.string(),
      websiteId: z.string(),
      reportId: z.string(),
      url: z.string().url(),
    })
    .parse(JSON.parse(msg));

  try {
    const result = await generateLighthouse(payload.url);

    logger.info('Successfully generated lighthouse report');

    const performanceScore =
      Number(get(result, ['categories', 'performance', 'score'], 0)) * 100;
    const accessibilityScore =
      Number(get(result, ['categories', 'accessibility', 'score'], 0)) * 100;
    const bestPracticesScore =
      Number(get(result, ['categories', 'best-practices', 'score'], 0)) * 100;
    const seoScore =
      Number(get(result, ['categories', 'seo', 'score'], 0)) * 100;

    await prisma.websiteLighthouseReport.update({
      where: {
        id: payload.reportId,
      },
      data: {
        status: WebsiteLighthouseReportStatus.Success,
        result: JSON.stringify(result),
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        seoScore,
      },
    });
  } catch (err) {
    logger.error('Failed to generate lighthouse report:', err);
    await prisma.websiteLighthouseReport.update({
      where: {
        id: payload.reportId,
      },
      data: {
        status: WebsiteLighthouseReportStatus.Failed,
        errorMessage: String(err),
      },
    });
  } finally {
    subscribeEventBus.emit('onLighthouseWorkCompleted', payload.workspaceId, {
      websiteId: payload.websiteId,
    });
  }
}
