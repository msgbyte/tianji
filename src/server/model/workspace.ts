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

export async function getWorkspaceWebsitePageviewStats(
  websiteId: string,
  filters: QueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseFilters(websiteId, {
    ...filters,
    eventType: EVENT_TYPE.pageView,
  });

  return prisma.$queryRaw`
    select
      ${getDateQuery('website_event.created_at', unit, timezone)} x,
      count(*) y
    from website_event
      ${joinSession}
    where website_event.website_id = ${params.websiteId}
      and website_event.created_at
    between ${params.startDate} and ${(params as any).endDate}
      and event_type = {{eventType}}
      ${filterQuery}
    group by 1
  `;
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
