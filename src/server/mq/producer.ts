import zmq from 'zeromq';
import { zmqUrl } from './shared.js';
import { logger } from '../utils/logger.js';

const sock = new zmq.Push();

sock.bind(zmqUrl).then(() => {
  logger.info('Producer bound to:', zmqUrl);
});

export async function sendBuildLighthouseMessageQueue(
  workspaceId: string,
  websiteId: string,
  reportId: string,
  url: string
) {
  await sock.send([
    'lighthouse',
    JSON.stringify({ workspaceId, websiteId, reportId, url }),
  ]);
}
