import { prisma } from './_client.js';
import { nanoid } from 'nanoid';
import { getRequestInfo } from '../utils/detect.js';
import { IncomingMessage } from 'http';
import { ShortLinkType } from '@prisma/client';
import { getDateArray } from '@tianji/shared';
import {
  BaseQueryFilters,
  getDateQuery,
  QueryOptions,
} from '../utils/prisma.js';

/**
 * Create a short link
 */
export async function createShortLink(params: {
  workspaceId: string;
  originalUrl: string;
  code?: string; // Optional custom code
  type?: ShortLinkType;
  title?: string;
  description?: string;
}) {
  const { workspaceId, originalUrl, code, type, title, description } = params;

  const shortCode = code || nanoid(10);

  const existing = await prisma.shortLink.findUnique({
    where: {
      code: shortCode,
    },
  });

  if (existing) {
    throw new Error('Short link code already exists');
  }

  const shortLink = await prisma.shortLink.create({
    data: {
      workspaceId,
      code: shortCode,
      originalUrl,
      title,
      description,
      type,
      enabled: true,
    },
  });

  return shortLink;
}

/**
 * Get short link by code
 */
export async function getShortLinkByCode(code: string) {
  const shortLink = await prisma.shortLink.findUnique({
    where: {
      code,
    },
  });

  return shortLink;
}

/**
 * Get short link by id and workspaceId
 */
export async function getShortLink(workspaceId: string, id: string) {
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  return shortLink;
}

/**
 * Update short link
 */
export async function updateShortLink(params: {
  workspaceId: string;
  id: string;
  originalUrl?: string;
  title?: string;
  description?: string;
  enabled?: boolean;
}) {
  const { workspaceId, id, ...data } = params;

  const shortLink = await prisma.shortLink.updateMany({
    where: {
      id,
      workspaceId,
    },
    data,
  });

  return shortLink;
}

/**
 * Delete short link (soft delete)
 */
export async function deleteShortLink(workspaceId: string, id: string) {
  const shortLink = await prisma.shortLink.updateMany({
    where: {
      id,
      workspaceId,
    },
    data: {
      deletedAt: new Date(),
      enabled: false,
    },
  });

  return shortLink;
}

/**
 * Get all short links for a workspace
 */
export async function getWorkspaceShortLinks(workspaceId: string) {
  const shortLinks = await prisma.shortLink.findMany({
    where: {
      workspaceId,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return shortLinks;
}

/**
 * Record access log for short link
 */
export async function recordShortLinkAccess(
  shortLinkId: string,
  req: IncomingMessage,
  referrer?: string
) {
  const {
    userAgent,
    browser,
    os,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
    language,
  } = await getRequestInfo(req);

  // Detect device type based on user agent
  const device = getDeviceType(userAgent);

  const access = await prisma.shortLinkAccess.create({
    data: {
      shortLinkId,
      ip,
      country,
      subdivision1,
      subdivision2,
      city,
      longitude,
      latitude,
      accuracyRadius,
      browser,
      os,
      device,
      language,
      referrer,
      userAgent,
    },
  });

  return access;
}

/**
 * Get access statistics for a short link
 */
export async function getShortLinkAccessStats(
  workspaceId: string,
  shortLinkId: string,
  startDate?: Date,
  endDate?: Date
) {
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      workspaceId,
    },
  });

  if (!shortLink) {
    throw new Error('Short link not found');
  }

  const where: any = {
    shortLinkId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const totalAccesses = await prisma.shortLinkAccess.count({
    where,
  });

  const accessesByCountry = await prisma.shortLinkAccess.groupBy({
    by: ['country'],
    where,
    _count: {
      country: true,
    },
    orderBy: {
      _count: {
        country: 'desc',
      },
    },
    take: 10,
  });

  const accessesByBrowser = await prisma.shortLinkAccess.groupBy({
    by: ['browser'],
    where,
    _count: {
      browser: true,
    },
    orderBy: {
      _count: {
        browser: 'desc',
      },
    },
    take: 10,
  });

  const accessesByDevice = await prisma.shortLinkAccess.groupBy({
    by: ['device'],
    where,
    _count: {
      device: true,
    },
    orderBy: {
      _count: {
        device: 'desc',
      },
    },
  });

  return {
    totalAccesses,
    accessesByCountry,
    accessesByBrowser,
    accessesByDevice,
  };
}

/**
 * Get time series access statistics for a short link
 */
export async function getShortLinkAccessTimeSeries(
  workspaceId: string,
  shortLinkId: string,
  filter: BaseQueryFilters,
  options: QueryOptions = {}
) {
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      workspaceId,
    },
  });

  if (!shortLink) {
    throw new Error('Short link not found');
  }

  const { startDate, endDate } = filter;
  const { timezone = 'utc', unit = 'day' } = options;

  const results = await prisma.$queryRaw<{ date: string; count: BigInt }[]>`
    SELECT
      ${getDateQuery('"createdAt"', unit, timezone)} "date",
      count(*) "count"
    FROM
      "ShortLinkAccess"
    WHERE
      "shortLinkId" = ${shortLinkId}
      and "createdAt" between ${startDate}::timestamptz and ${endDate}::timestamptz
    GROUP BY 1
  `;

  return getDateArray(
    results.map((res) => ({
      date: res.date,
      count: Number(res.count),
    })),
    startDate,
    endDate,
    unit,
    timezone
  );
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent?: string): string {
  if (!userAgent) {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}
