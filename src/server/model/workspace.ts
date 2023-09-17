import { prisma } from './_client';
import { QueryFilters, parseFilters, getDateQuery } from '../utils/prisma';
import { DEFAULT_RESET_DATE, EVENT_TYPE } from '../utils/const';

export async function getWorkspaceUser(workspaceId: string, userId: string) {
  const info = await prisma.workspacesOnUsers.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });

  return info;
}

export async function checkIsWorkspaceUser(
  workspaceId: string,
  userId: string
) {
  const info = await getWorkspaceUser(workspaceId, userId);

  if (info) {
    return true;
  } else {
    return false;
  }
}

export async function getWorkspace(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
  });
}

export async function getWorkspaceWebsites(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    select: {
      websites: true,
    },
  });

  return workspace?.websites ?? [];
}

export async function getWorkspaceWebsiteInfo(
  workspaceId: string,
  websiteId: string
) {
  const websiteInfo = await prisma.website.findUnique({
    where: {
      id: websiteId,
      workspaceId,
    },
  });

  return websiteInfo;
}

export async function updateWorkspaceWebsiteInfo(
  workspaceId: string,
  websiteId: string,
  name: string,
  domain: string
) {
  const websiteInfo = await prisma.website.update({
    where: {
      id: websiteId,
      workspaceId,
    },
    data: {
      name,
      domain,
    },
  });

  return websiteInfo;
}

export async function addWorkspaceWebsite(
  workspaceId: string,
  name: string,
  domain: string
) {
  const website = await prisma.website.create({
    data: {
      name,
      domain,
      workspaceId,
    },
  });

  return website;
}

export async function deleteWorkspaceWebsite(
  workspaceId: string,
  websiteId: string
) {
  const website = await prisma.website.delete({
    where: {
      id: websiteId,
      workspaceId,
    },
  });

  return website;
}

export async function getWorkspaceWebsiteDateRange(websiteId: string) {
  const { params } = await parseFilters(websiteId, {
    startDate: new Date(DEFAULT_RESET_DATE),
  });

  const res = await prisma.websiteEvent.aggregate({
    _max: {
      createdAt: true,
    },
    _min: {
      createdAt: true,
    },
    where: {
      websiteId,
      createdAt: {
        gt: params.startDate,
      },
    },
  });

  return {
    max: res._max.createdAt,
    min: res._min.createdAt,
  };
}

export async function getWorkspaceWebsitePageviewStats(
  websiteId: string,
  filters: QueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseFilters(websiteId, {
    ...filters,
  });

  return prisma.$queryRaw`
    select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} x,
      count(1) y
    from "WebsiteEvent"
      ${joinSession}
    where "WebsiteEvent"."websiteId" = ${params.websiteId}::uuid
      and "WebsiteEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      ${filterQuery}
    group by 1
  `;
}

export async function getWorkspaceWebsiteSessionStats(
  websiteId: string,
  filters: QueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseFilters(websiteId, {
    ...filters,
  });

  return prisma.$queryRaw`
    select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} x,
      count(distinct "WebsiteEvent"."sessionId") y
    from "WebsiteEvent"
      ${joinSession}
    where "WebsiteEvent"."websiteId" = ${params.websiteId}::uuid
      and "WebsiteEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      ${filterQuery}
    group by 1
    `;
}
