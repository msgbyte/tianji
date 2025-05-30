import { buildQueryWithCache } from '../cache/index.js';
import { prisma } from './_client.js';

export const { get: getGatewayInfoCache, del: clearGatewayInfoCache } =
  buildQueryWithCache(async (workspaceId: string, gatewayId: string) => {
    const gatewayInfo = await prisma.aIGateway.findUnique({
      where: {
        workspaceId,
        id: gatewayId,
      },
    });

    return gatewayInfo;
  });
