import dayjs from 'dayjs';
import { prisma } from '../_client.js';
import {
  POSTGRESQL_DATE_FORMATS,
  WebsiteQueryFilters,
} from '../../utils/prisma.js';
import {
  getWorkspaceWebsiteStats,
  getWorkspaceWebsitePageview,
} from './index.js';

export async function getWebsiteInfoPublic(shareId: string) {
  return prisma.website.findFirst({
    where: {
      shareId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      domain: true,
      shareId: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getWebsitePublicStats({
  websiteId,
  startAt,
  endAt,
  prevStartAt,
  prevEndAt,
  timezone,
  unit,
}: {
  websiteId: string;
  startAt: number;
  endAt: number;
  prevStartAt: number;
  prevEndAt: number;
  timezone: string;
  unit: keyof typeof POSTGRESQL_DATE_FORMATS;
}) {
  const currentFilters: WebsiteQueryFilters = {
    startDate: new Date(startAt),
    endDate: new Date(endAt),
    timezone,
    unit,
  };
  const prevFilters: WebsiteQueryFilters = {
    startDate: new Date(prevStartAt),
    endDate: new Date(prevEndAt),
    timezone,
    unit,
  };

  const [current, previous, pageviews] = await Promise.all([
    getWorkspaceWebsiteStats(websiteId, currentFilters),
    getWorkspaceWebsiteStats(websiteId, prevFilters),
    getWorkspaceWebsitePageview(websiteId, currentFilters),
  ]);

  const value = current?.[0];
  const prev = previous?.[0];

  const pageviewsValue = Number(value?.pageviews ?? 0);
  const pageviewsPrev = Number(prev?.pageviews ?? 0);
  const visitorsValue = Number(value?.uniques ?? 0);
  const visitorsPrev = Number(prev?.uniques ?? 0);
  const bouncesValue = Number(value?.bounces ?? 0);
  const bouncesPrev = Number(prev?.bounces ?? 0);
  const totalTimeValue = Number(value?.totaltime ?? 0);
  const totalTimePrev = Number(prev?.totaltime ?? 0);

  const effectiveVisits = Math.max(pageviewsValue - bouncesValue, 0);
  const effectivePrevVisits = Math.max(pageviewsPrev - bouncesPrev, 0);

  const bounceRateValue =
    pageviewsValue > 0 ? (bouncesValue / pageviewsValue) * 100 : 0;
  const bounceRatePrev =
    pageviewsPrev > 0 ? (bouncesPrev / pageviewsPrev) * 100 : 0;

  const averageDurationValue =
    effectiveVisits > 0 ? totalTimeValue / effectiveVisits : 0;
  const averageDurationPrev =
    effectivePrevVisits > 0 ? totalTimePrev / effectivePrevVisits : 0;

  return {
    pageviews: {
      value: pageviewsValue,
      prev: pageviewsPrev,
    },
    visitors: {
      value: visitorsValue,
      prev: visitorsPrev,
    },
    bounce_rate: {
      value: bounceRateValue,
      prev: bounceRatePrev,
    },
    average_visit_duration: {
      value: averageDurationValue,
      prev: averageDurationPrev,
    },
    pageviews_trend: pageviews.map((item) => ({
      date: dayjs(item.x).toISOString(),
      value: Number(item.y) || 0,
    })),
  };
}
