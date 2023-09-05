import { prisma } from './_client';

export async function checkIsWorkspaceUser(
  workspaceId: string,
  userId: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
      users: {
        some: {
          userId,
        },
      },
    },
  });

  if (workspace) {
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
