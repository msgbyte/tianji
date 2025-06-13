import { MonitorProvider } from './type.js';
import { timedFetch, TimedFetchOptions } from '../../../utils/fetch.js';
import { logger } from '../../../utils/logger.js';
import dayjs from 'dayjs';
import https from 'https';
import * as httpModule from 'http';
import { saveMonitorStatus } from './_utils.js';

export const http: MonitorProvider<{
  url: string;
  method?: string;
  timeout?: number; // second
  contentType?: string;
  headers?: string;
  bodyValue?: string;
  maxRedirects?: number;
  ignoreTLS?: boolean;
  validStatusCodes?: number[];
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const {
      url,
      method = 'get',
      timeout = 30,
      contentType,
      headers,
      bodyValue,
      maxRedirects,
      ignoreTLS,
      validStatusCodes = [],
    } = monitor.payload;

    const requestHeaders: Record<string, string> = {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      ...(contentType ? { 'Content-Type': contentType } : {}),
    };

    const config: TimedFetchOptions = {
      method: (method || 'get').toUpperCase() as TimedFetchOptions['method'],
      timeout: timeout * 1000,
      headers: requestHeaders,
      maxRedirects: maxRedirects,
      parseJson: false, // Keep as raw text for consistent behavior
    };

    if (headers) {
      try {
        const customHeaders = JSON.parse(headers);
        if (typeof customHeaders === 'object') {
          config.headers = {
            ...config.headers,
            ...customHeaders,
          };
        }
      } catch (err) {
        logger.warn('Unabled header:', headers);
      }
    }

    if (bodyValue) {
      config.body = bodyValue;
    }

    const isHttps = url.toLowerCase().startsWith('https:');

    if (isHttps) {
      const httpsAgentOptions = {
        maxCachedSessions: 0, // Use Custom agent to disable session reuse (https://github.com/nodejs/node/issues/3940)
        rejectUnauthorized: !ignoreTLS,
        keepAlive: false,
      };

      const httpsAgent = new https.Agent(httpsAgentOptions);
      config.httpsAgent = httpsAgent;
      httpsAgent.once('keylog', (line, tlsSocket) => {
        tlsSocket.once('secureConnect', async () => {
          try {
            const { valid, certInfo } = checkCertificate(tlsSocket);

            await saveMonitorStatus(monitor.id, 'tls', {
              valid,
              certInfo,
            });
          } catch (err) {}
        });
      });
    } else {
      const httpAgent = new httpModule.Agent({
        keepAlive: false,
      });
      config.httpAgent = httpAgent;
    }

    try {
      const res = await timedFetch(url, config);

      saveMonitorStatus(monitor.id, 'timings', {
        ...res.timings,
      }).catch((err) => {
        logger.error(
          `run monitor(${monitor.id}) save timing error:`,
          String(err)
        );
      });

      // Use the total time from timedFetch instead of manual calculation
      const diff = Math.round(res.timings.total);

      if (!validStatusCodes || validStatusCodes.length === 0) {
        // default is 200 - 299
        if (res.status < 200 || res.status > 299) {
          return -1;
        }
      } else {
        // if config validStatusCodes, check it
        if (!validStatusCodes.includes(res.status)) {
          return -1;
        }
      }

      return diff;
    } catch (err) {
      logger.error(`run monitor(${monitor.id}) http error`, String(err));
      return -1;
    }
  },
};

function checkCertificate(tlsSocket: any) {
  if (!tlsSocket) {
    throw new Error('No socket found');
  }

  const info = tlsSocket.getPeerCertificate(true);
  const valid = tlsSocket.authorized || false;

  logger.debug('cert', 'Parsing Certificate Info', info);

  const parsedInfo = parseCertificateInfo(info);

  return {
    valid: valid,
    certInfo: parsedInfo,
  };
}

function parseCertificateInfo(info: any) {
  let link = info;
  let i = 0;

  const existingList: Record<string, boolean> = {};

  while (link) {
    logger.debug('cert', `[${i}] ${link.fingerprint}`);

    if (!link.valid_from || !link.valid_to) {
      break;
    }
    link.validTo = new Date(link.valid_to);
    link.validFor = link.subjectaltname
      ?.replace(/DNS:|IP Address:/g, '')
      .split(', ');
    link.daysRemaining = getDaysRemaining(new Date(), link.validTo);

    existingList[link.fingerprint] = true;

    // Move up the chain until loop is encountered
    if (link.issuerCertificate == null) {
      link.certType = i === 0 ? 'self-signed' : 'root CA';
      break;
    } else if (link.issuerCertificate.fingerprint in existingList) {
      // a root CA certificate is typically "signed by itself"  (=> "self signed certificate") and thus the "issuerCertificate" is a reference to itself.
      logger.debug('cert', `[Last] ${link.issuerCertificate.fingerprint}`);
      link.certType = i === 0 ? 'self-signed' : 'root CA';
      link.issuerCertificate = null;
      break;
    } else {
      link.certType = i === 0 ? 'server' : 'intermediate CA';
      link = link.issuerCertificate;
    }

    // Should be no use, but just in case.
    if (i > 500) {
      throw new Error('Dead loop occurred in parseCertificateInfo');
    }
    i++;
  }

  return info;
}

/**
 * Get days remaining from a time range
 * @param {Date} validFrom Start date
 * @param {Date} validTo End date
 * @returns {number} Number of days remaining
 */
function getDaysRemaining(validFrom: Date, validTo: Date) {
  const daysRemaining = dayjs(validTo).diff(validFrom, 'days');

  return daysRemaining;
}
