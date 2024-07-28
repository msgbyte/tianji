import { MonitorProvider } from './type.js';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../../../utils/logger.js';
import dayjs from 'dayjs';
import https from 'https';
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
    } = monitor.payload;

    const config: AxiosRequestConfig = {
      url: url,
      method: (method || 'get').toLowerCase(),
      timeout: timeout * 1000,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      maxRedirects: maxRedirects,
      // validateStatus: (status) => {
      //   return checkStatusCode(status, this.getAcceptedStatuscodes());
      // },
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
      config.data = bodyValue;
    }

    const httpsAgentOptions = {
      maxCachedSessions: 0, // Use Custom agent to disable session reuse (https://github.com/nodejs/node/issues/3940)
      rejectUnauthorized: !ignoreTLS,
    };

    const httpsAgent = (config.httpsAgent = new https.Agent(httpsAgentOptions));
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

    try {
      const startTime = dayjs();
      const res = await axios({ ...config });

      const diff = dayjs().diff(startTime, 'ms');

      if (res.status >= 400) {
        return -1;
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
