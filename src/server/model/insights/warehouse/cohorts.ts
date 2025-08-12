import { prisma } from '../../_client.js';

export function getAllCohorts(workspaceId: string) {
  return prisma.warehouseCohorts.findMany({
    where: {
      workspaceId,
    },
  });
}
