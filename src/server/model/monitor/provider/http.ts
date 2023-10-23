import { MonitorProvider } from './type';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../../../utils/logger';
import dayjs from 'dayjs';
import { prisma } from '../../_client';

export const http: MonitorProvider<{
  url: string;
  method?: string;
  timeout?: number; // second
  contentType?: string;
  bodyValue?: string;
  maxRedirects?: number;
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
      bodyValue,
      maxRedirects,
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

    if (bodyValue) {
      config.data = bodyValue;
    }

    try {
      const startTime = dayjs();
      const res = await axios(config);

      const diff = dayjs().diff(startTime, 'ms');

      if (url.startsWith('https:')) {
        try {
          const { valid, certInfo } = checkCertificate(res);

          await prisma.monitorStatus.upsert({
            where: {
              monitorId_statusName: {
                monitorId: monitor.id,
                statusName: 'tls',
              },
            },
            update: {
              payload: {
                valid,
                certInfo,
              },
            },
            create: {
              monitorId: monitor.id,
              statusName: 'tls',
              payload: {
                valid,
                certInfo,
              },
            },
          });
        } catch (err) {}
      }

      return diff;
    } catch (err) {
      logger.error('run monitor http error', err);
      return -1;
    }
  },
};

function checkCertificate(res: AxiosResponse<any, any>) {
  if (!res.request.res.socket) {
    throw new Error('No socket found');
  }

  const info = res.request.res.socket.getPeerCertificate(true);
  const valid = res.request.res.socket.authorized || false;

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
