import { TelemetrySession } from '@prisma/client';
import { Request } from 'express';
import { hashUuid } from '../utils/common';
import { getRequestInfo } from '../utils/detect';
import { prisma } from './_client';

export async function recordTelemetryEvent(req: Request) {
  const url = req.query.url ?? req.headers.referer;
  if (!(url && typeof url === 'string')) {
    return;
  }

  const session = await findSession(req, url);
  if (!session) {
    return;
  }

  const { origin, pathname } = new URL(url);

  await prisma.telemetryEvent.create({
    data: {
      sessionId: session.id,
      urlOrigin: origin,
      urlPath: pathname,
    },
  });
}

export async function sumTelemetryEvent(req: Request): Promise<number> {
  const url = req.query.url ?? req.headers.referer;
  if (!(url && typeof url === 'string')) {
    return 0;
  }

  const { origin, pathname } = new URL(url);

  const number = await prisma.telemetryEvent.count({
    where: {
      urlOrigin: origin,
      urlPath: pathname,
    },
  });

  return number;
}

async function findSession(req: Request, url: string) {
  const { hostname } = new URL(url);

  const {
    userAgent,
    browser,
    os,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
  } = await getRequestInfo(req);

  const sessionId = hashUuid(hostname, ip, userAgent!);

  let session = await loadSession(sessionId);
  if (!session) {
    try {
      session = await prisma.telemetrySession.create({
        data: {
          id: sessionId,
          hostname,
          browser,
          os,
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

  return session;
}

async function loadSession(
  sessionId: string
): Promise<TelemetrySession | null> {
  const session = await prisma.telemetrySession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return null;
  }

  return session;
}
