import { buildQueryWithCache } from '../../cache/index.js';
import { prisma } from '../_client.js';

const { get: getWorkspaceConfig, del: clearWorkspaceConfigCache } =
  buildQueryWithCache(async (workspaceId: string, key: string) => {
    return prisma.workspaceConfig.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key,
        },
      },
    });
  });

export { getWorkspaceConfig };

export async function setWorkspaceConfig(
  workspaceId: string,
  key: string,
  value: any
) {
  const config = await prisma.workspaceConfig.upsert({
    where: {
      workspaceId_key: {
        workspaceId,
        key,
      },
    },
    update: {
      value,
      updatedAt: new Date(),
    },
    create: {
      workspaceId,
      key,
      value,
    },
  });

  clearWorkspaceConfigCache(workspaceId, key);

  return config;
}
