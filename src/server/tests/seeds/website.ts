import { prisma } from '../../model/_client';
import { hashUuid } from '../../utils/common';
import { faker } from '@faker-js/faker';
import { getLocation } from '../../utils/detect';
import dayjs from 'dayjs';
import { WebsiteSession } from '@prisma/client';

async function main() {
  Array.from({ length: 200 }).map(async (_, i) => {
    const session = await createSession();

    await createSessionEvent(session);

    console.log(`generate session ${i} completed`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

const startDate = dayjs().subtract(30, 'days').toDate();
const endDate = dayjs().toDate();
async function createSession() {
  const websiteId = 'clrytmpbe000lvyo434zxiwqh';
  const hostname = faker.internet.domainName();
  const ip = faker.internet.ipv4();
  const userAgent = faker.internet.userAgent();
  const sessionId = hashUuid(websiteId, hostname, ip, userAgent);
  const browser = faker.helpers.arrayElement([
    'chromium-webview',
    'ios-webview',
    'ios',
    'edge-ios',
    'crios',
    'ios',
  ]);
  const os = faker.helpers.arrayElement([
    'Android OS',
    'iOS',
    'Mac OS',
    'Windows 10',
  ]);
  const device = faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']);
  const screen = faker.helpers.arrayElement([
    '1366x768',
    '1920x1080',
    '1440x900',
    '800x600',
  ]);
  const language = faker.helpers.arrayElement(['zh-CN', 'en-US']);
  const {
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
  } = (await getLocation(ip)) ?? {};
  const createdAt = faker.date.between({ from: startDate, to: endDate });

  const session = await prisma.websiteSession.create({
    data: {
      id: sessionId,
      websiteId,
      hostname,
      browser,
      os,
      device,
      screen,
      language,
      ip,
      country,
      subdivision1,
      subdivision2,
      city,
      longitude,
      latitude,
      accuracyRadius,
      createdAt,
    },
  });

  return session;
}

async function createSessionEvent(session: WebsiteSession) {
  await prisma.websiteEvent.createMany({
    data: Array.from({ length: faker.number.int({ max: 20 }) }).map(() => ({
      sessionId: session.id,
      websiteId: session.websiteId,
      urlPath: [
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.directoryPath(),
        faker.system.filePath(),
      ].join(''), // generate long path
      createdAt: faker.date.between({
        from: session.createdAt,
        to: endDate,
      }),
    })),
  });
}
