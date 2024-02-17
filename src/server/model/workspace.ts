import { prisma } from './_client';
import {
  QueryFilters,
  parseFilters,
  getDateQuery,
  getTimestampIntervalQuery,
} from '../utils/prisma';
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
