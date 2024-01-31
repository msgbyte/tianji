import { PrismaClient } from '@prisma/client';
import { getLocation } from '../../utils/detect';
import pMap from 'p-map';

const prisma = new PrismaClient();

/**
 * Update ip latitude and longitude
 */
async function main() {
  console.log(`[populate-ip-location] start scan`);
  const start = Date.now();
  const noParseWebsiteSessions = await prisma.websiteSession.findMany({
    where: {
      ip: {
        not: null,
      },
      latitude: null,
    },
  });

  console.log(
    `[populate-ip-location] find ${noParseWebsiteSessions.length} records wait to parse location`
  );

  let count = 0;
  const queue: {
    id: string;
    latitude: number | undefined;
    longitude: number | undefined;
    accuracyRadius: number | undefined;
  }[] = [];

  for (const session of noParseWebsiteSessions) {
    if (!session.ip) {
      continue;
    }

    const res = await getLocation(session.ip);
    if (!res) {
      continue;
    }

    const { latitude, longitude, accuracyRadius } = res;
    queue.push({
      id: session.id,
      latitude,
      longitude,
      accuracyRadius,
    });
    count++;
  }

  console.log(`[populate-ip-location] find ${count} records wait to update`);

  if (count === 0) {
    return;
  }

  let current = 0;

  await pMap(
    queue,
    async (item) => {
      await prisma.websiteSession.update({
        where: {
          id: item.id,
        },
        data: {
          latitude: item.latitude,
          longitude: item.longitude,
          accuracyRadius: item.accuracyRadius,
        },
      });

      current++;

      if (current % 100 === 0) {
        console.log(
          `[populate-ip-location] updated ${current}/${count} records`
        );
      }
    },
    {
      concurrency: 20,
    }
  );

  console.log(
    `[populate-ip-location] update ${count} records location, usage: ${
      Date.now() - start
    }ms`
  );
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log(`[populate-ip-location] end`);
    await prisma.$disconnect();
  });
