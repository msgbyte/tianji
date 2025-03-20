import { Prisma, Application, ApplicationSession } from '@prisma/client';
import {
  flattenJSON,
  hashUuid,
  isCuid,
  parseToken,
} from '../../utils/common.js';
import { prisma } from '../_client.js';
import { Request } from 'express';
import { getClientInfo } from '../../utils/detect.js';
import {
  DATA_TYPE,
  EVENT_NAME_LENGTH,
  EVENT_TYPE,
  URL_LENGTH,
} from '../../utils/const.js';
import type { DynamicData } from '../../utils/types.js';

export interface ApplicationEventPayload {
  data?: object;
  language?: string;
  os?: string;
  url?: string;
  application: string;
  name?: string;
}

export async function findSession(req: Request): Promise<
  ApplicationSession & {
    workspaceId: string;
  }
> {
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
    application: applicationId,
    os,
    language,
  } = payload as ApplicationEventPayload;

  if (!isCuid(applicationId)) {
    throw new Error('Invalid application ID.');
  }

  // Find application
  const application = await loadApplication(applicationId);

  if (!application) {
    throw new Error(`Application not found: ${applicationId}.`);
  }

  const {
    userAgent,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
  } = await getClientInfo(req, payload);

  const sessionId = hashUuid(applicationId, ip, userAgent!);

  // Find session
  let session = await loadSession(sessionId);

  // Create a session if not found
  if (!session) {
    try {
      session = await prisma.applicationSession.create({
        data: {
          id: sessionId,
          applicationId,
          os,
          language,
          ip,
          country,
          subdivision1,
          subdivision2,
          city,
          longitude,
          latitude,
          accuracyRadius,
        },
      });
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('unique constraint')) {
        throw e;
      }
    }
  }

  const res: any = { ...session!, workspaceId: application.workspaceId };

  return res;
}

export async function loadApplication(
  applicationId: string
): Promise<Application | null> {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },
  });

  if (!application || application.deletedAt) {
    return null;
  }

  return application;
}

async function loadSession(
  sessionId: string
): Promise<ApplicationSession | null> {
  const session = await prisma.applicationSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return null;
  }

  return session;
}

export async function saveApplicationEvent(data: {
  sessionId: string;
  applicationId: string;
  eventName?: string;
  eventData?: any;
  screenName?: string;
  screenParams?: Record<string, any>;
}) {
  const {
    applicationId,
    sessionId,
    eventName,
    eventData,
    screenName,
    screenParams,
  } = data;

  const applicationEvent = await prisma.applicationEvent.create({
    data: {
      applicationId,
      sessionId,
      eventType: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
      eventName: eventName ? eventName?.substring(0, EVENT_NAME_LENGTH) : null,
      screenName,
      screenParams,
    },
  });

  if (eventData) {
    const jsonKeys = flattenJSON(eventData);

    const flattendData = jsonKeys.map((a) => ({
      applicationEventId: applicationEvent.id,
      applicationId,
      eventKey: a.key,
      stringValue:
        a.dynamicDataType === DATA_TYPE.number
          ? String(Number(parseFloat(a.value).toFixed(4)))
          : a.dynamicDataType === DATA_TYPE.date
            ? a.value.split('.')[0] + 'Z'
            : a.value.toString(),
      numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
      dateValue:
        a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
      dataType: a.dynamicDataType,
    }));

    await prisma.applicationEventData.createMany({
      data: flattendData,
    });
  }

  return applicationEvent;
}

export async function saveApplicationSessionData(data: {
  applicationId: string;
  sessionId: string;
  sessionData: DynamicData;
}) {
  const { applicationId, sessionId, sessionData } = data;

  const jsonKeys = flattenJSON(sessionData);

  const flattendData = jsonKeys.map(
    (a) =>
      ({
        applicationId,
        sessionId,
        key: a.key,
        stringValue:
          a.dynamicDataType === DATA_TYPE.number
            ? String(Number(parseFloat(a.value).toFixed(4)))
            : a.dynamicDataType === DATA_TYPE.date
              ? a.value.split('.')[0] + 'Z'
              : a.value.toString(),
        numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
        dateValue:
          a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
        dataType: a.dynamicDataType,
      }) satisfies Prisma.ApplicationSessionDataCreateManyInput
  );

  return prisma.$transaction([
    prisma.applicationSessionData.deleteMany({
      where: {
        sessionId,
      },
    }),
    prisma.applicationSessionData.createMany({
      data: flattendData,
    }),
  ]);
}
