import { Website, WebsiteSession } from '@prisma/client';
import { flattenJSON, hashUuid, isUuid, parseToken } from '../utils/common';
import { prisma } from './_client';
import { Request } from 'express';
import { getClientInfo } from '../utils/detect';
import {
  DATA_TYPE,
  EVENT_NAME_LENGTH,
  EVENT_TYPE,
  URL_LENGTH,
} from '../utils/const';
import type { DynamicData } from '../utils/types';
import dayjs from 'dayjs';

export interface WebsiteEventPayload {
  data?: object;
  hostname: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url?: string;
  website: string;
  name?: string;
}

export async function findSession(req: Request): Promise<{
  id: any;
  websiteId: string;
  hostname: string;
  browser: string;
  os: any;
  device: string;
  screen: string;
  language: string;
  country: any;
  subdivision1: any;
  subdivision2: any;
  city: any;
  workspaceId: string;
}> {
  // Verify payload
  const { payload } = req.body;

  // Check if cache token is passed
  const cacheToken = req.headers['x-tianji-cache'] as string;

  if (cacheToken) {
    const result = parseToken(cacheToken);

    if (result) {
      return result as any;
    }
  }

  const {
    website: websiteId,
    hostname,
    screen,
    language,
  } = payload as WebsiteEventPayload;

  // Check the hostname value for legality to eliminate dirty data
  const validHostnameRegex = /^[\w-.]+$/;
  if (typeof hostname === 'string' && !validHostnameRegex.test(hostname)) {
    throw new Error('Invalid hostname.');
  }

  if (!isUuid(websiteId)) {
    throw new Error('Invalid website ID.');
  }

  // Find website
  const website = await loadWebsite(websiteId);

  if (!website) {
    throw new Error(`Website not found: ${websiteId}.`);
  }

  const {
    userAgent,
    browser,
    os,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
    device,
  } = await getClientInfo(req, payload);

  const sessionId = hashUuid(websiteId, hostname!, ip, userAgent!);

  // Find session
  let session = await loadSession(sessionId);

  // Create a session if not found
  if (!session) {
    try {
      session = await prisma.websiteSession.create({
        data: {
          id: sessionId,
          websiteId,
          hostname,
          browser,
          os,
          device,
          screen,
          language,
          country,
          subdivision1,
          subdivision2,
          city,
        },
      });
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('unique constraint')) {
        throw e;
      }
    }
  }

  const res: any = { ...session!, workspaceId: website.workspaceId };

  return res;
}

export async function loadWebsite(websiteId: string): Promise<Website | null> {
  const website = await prisma.website.findUnique({
    where: {
      id: websiteId,
    },
  });

  if (!website || website.deletedAt) {
    return null;
  }

  return website;
}

async function loadSession(sessionId: string): Promise<WebsiteSession | null> {
  const session = await prisma.websiteSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return null;
  }

  return session;
}

export async function saveWebsiteEvent(data: {
  sessionId: string;
  websiteId: string;
  urlPath: string;
  urlQuery?: string;
  referrerPath?: string;
  referrerQuery?: string;
  referrerDomain?: string;
  pageTitle?: string;
  eventName?: string;
  eventData?: any;
}) {
  const {
    websiteId,
    sessionId,
    urlPath,
    urlQuery,
    referrerPath,
    referrerQuery,
    referrerDomain,
    eventName,
    eventData,
    pageTitle,
  } = data;

  const websiteEvent = await prisma.websiteEvent.create({
    data: {
      websiteId,
      sessionId,
      urlPath: urlPath?.substring(0, URL_LENGTH),
      urlQuery: urlQuery?.substring(0, URL_LENGTH),
      referrerPath: referrerPath?.substring(0, URL_LENGTH),
      referrerQuery: referrerQuery?.substring(0, URL_LENGTH),
      referrerDomain: referrerDomain?.substring(0, URL_LENGTH),
      pageTitle,
      eventType: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
      eventName: eventName ? eventName?.substring(0, EVENT_NAME_LENGTH) : null,
    },
  });

  if (eventData) {
    const jsonKeys = flattenJSON(eventData);

    // id, websiteEventId, eventStringValue
    const flattendData = jsonKeys.map((a) => ({
      websiteEventId: websiteEvent.id,
      websiteId,
      eventKey: a.key,
      stringValue:
        a.dynamicDataType === DATA_TYPE.number
          ? parseFloat(a.value).toFixed(4)
          : a.dynamicDataType === DATA_TYPE.date
          ? a.value.split('.')[0] + 'Z'
          : a.value.toString(),
      numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
      dateValue:
        a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
      dataType: a.dynamicDataType,
    }));

    await prisma.websiteEventData.createMany({
      data: flattendData,
    });
  }

  return websiteEvent;
}

export async function saveWebsiteSessionData(data: {
  websiteId: string;
  sessionId: string;
  sessionData: DynamicData;
}) {
  const { websiteId, sessionId, sessionData } = data;

  const jsonKeys = flattenJSON(sessionData);

  const flattendData = jsonKeys.map((a) => ({
    websiteId,
    sessionId,
    key: a.key,
    stringValue:
      a.dynamicDataType === DATA_TYPE.number
        ? parseFloat(a.value).toFixed(4)
        : a.dynamicDataType === DATA_TYPE.date
        ? a.value.split('.')[0] + 'Z'
        : a.value.toString(),
    numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
    dateValue: a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
    dataType: a.dynamicDataType,
  }));

  return prisma.$transaction([
    prisma.websiteSessionData.deleteMany({
      where: {
        sessionId,
      },
    }),
    prisma.websiteSessionData.createMany({
      data: flattendData,
    }),
  ]);
}

export async function getWebsiteOnlineUserCount(
  websiteId: string
): Promise<number> {
  const startAt = dayjs().subtract(5, 'minutes').toDate();

  interface Ret {
    x: number;
  }

  const res = await prisma.$queryRaw<
    Ret[]
  >`SELECT count(distinct "sessionId") x FROM "WebsiteEvent" where "websiteId" = ${websiteId}::uuid AND "createdAt" >= ${startAt}`;
  console.log('res', res);

  return res?.[0].x ?? 0;
}
