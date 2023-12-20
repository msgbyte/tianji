import { prisma } from '../../_client';

export async function saveMonitorStatus(
  monitorId: string,
  statusName: string,
  payload: Record<string, any>
) {
  try {
    const res = await prisma.monitorStatus.upsert({
      where: {
        monitorId_statusName: {
          monitorId,
          statusName,
        },
      },
      update: {
        payload,
      },
      create: {
        monitorId,
        statusName,
        payload,
      },
    });

    return res;
  } catch (err) {
    console.error(err);

    return null;
  }
}
