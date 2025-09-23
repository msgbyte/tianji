import { prisma } from './_client.js';
import { parseWebsiteFilters } from '../utils/prisma.js';
import { DEFAULT_RESET_DATE } from '../utils/const.js';
import { buildQueryWithCache } from '../cache/index.js';

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

export async function getWorkspaceWebsiteDateRange(websiteId: string) {
  const { params } = await parseWebsiteFilters(websiteId, {
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

export async function getWorkspaceServiceCount(workspaceId: string) {
  const [
    website,
    application,
    monitor,
    telemetry,
    page,
    survey,
    feed,
    aiGateway,
    functionWorker,
  ] = await Promise.all([
    prisma.website.count({
      where: {
        workspaceId,
      },
    }),
    prisma.application.count({
      where: {
        workspaceId,
      },
    }),
    prisma.monitor.count({
      where: {
        workspaceId,
      },
    }),
    prisma.telemetry.count({
      where: {
        workspaceId,
      },
    }),
    prisma.monitorStatusPage.count({
      where: {
        workspaceId,
      },
    }),
    prisma.survey.count({
      where: {
        workspaceId,
      },
    }),
    prisma.feedChannel.count({
      where: {
        workspaceId,
      },
    }),
    prisma.aIGateway.count({
      where: {
        workspaceId,
      },
    }),
    prisma.functionWorker.count({
      where: {
        workspaceId,
      },
    }),
  ]);

  return {
    website,
    application,
    monitor,
    telemetry,
    page,
    survey,
    feed,
    aiGateway,
    functionWorker,
  };
}

export const { get: getWorkspaceSettings, del: clearWorkspaceSettingsCache } =
  buildQueryWithCache(async (workspaceId: string) => {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    return workspace?.settings ?? {};
  });
