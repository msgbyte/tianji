import gplay from 'google-play-scraper';
// @ts-ignore
import appstore from 'app-store-scraper';
import { prisma } from '../_client.js';
import { ApplicationStoreInfo } from '@prisma/client';

export async function setupStoreInfo(
  applicationId: string,
  options: {
    appstoreId?: string;
    playstoreId?: string;
  }
) {
  const { appstoreId, playstoreId } = options;

  await Promise.all(
    [
      appstoreId && upsertStoreInfo(applicationId, 'appstore', appstoreId),
      playstoreId && upsertStoreInfo(applicationId, 'googleplay', playstoreId),
    ].filter(Boolean)
  );
}

export async function upsertStoreInfo(
  applicationId: string,
  storeType: string,
  storeId: string
) {
  let info:
    | Omit<
        ApplicationStoreInfo,
        'applicationId' | 'storeType' | 'storeId' | 'createdAt' | 'updatedAt'
      >
    | undefined;
  if (storeType === 'googleplay') {
    try {
      const res = await gplay.app({
        appId: storeId,
      });

      info = {
        appId: res.appId,
        title: res.title,
        description: res.description,
        releaseNotes: res.recentChanges ?? '',
        url: res.url,
        downloads: res.maxInstalls,
        score: res.score,
        ratingCount: res.ratings,
        reviews: res.reviews,
        version: res.version,
        size: Number(res.size),
      };
    } catch (err) {
      throw new Error('Fetching Google Play Store Info failed: ' + String(err));
    }
  } else if (storeType === 'appstore') {
    try {
      const res = await appstore.app({
        id: Number(storeId.replace('id', '')),
      });

      info = {
        appId: res.appId,
        title: res.title,
        description: res.description,
        releaseNotes: res.releaseNotes ?? '',
        url: res.url,
        downloads: null,
        score: res.score,
        ratingCount: res.reviews,
        reviews: res.reviews,
        version: res.version,
        size: Number(res.size),
      };
    } catch (err) {
      throw new Error('Fetching App Store Info failed: ' + String(err));
    }
  }

  if (info) {
    await prisma.$transaction([
      prisma.applicationStoreInfo.upsert({
        where: {
          applicationId_storeType: {
            applicationId,
            storeType,
          },
        },
        create: {
          ...info,
          applicationId,
          storeType,
          storeId,
        },
        update: {
          ...info,
          storeId,
        },
      }),
      prisma.applicationStoreInfoHistory.create({
        data: {
          ...info,
          applicationId,
          storeType,
          storeId,
        },
      }),
    ]);
  }
}

export async function searchStoreApps(
  keyword: string,
  storeType: 'appstore' | 'googleplay'
) {
  if (storeType === 'appstore') {
    const res = await appstore.search({
      term: keyword,
      num: 20,
    });

    return res.map((app: any) => ({
      id: String(app.id),
      appId: app.appId,
      title: app.title,
      icon: app.icon,
    }));
  }

  if (storeType === 'googleplay') {
    const res = await gplay.search({
      term: keyword,
      num: 20,
    });

    return res.map((app: any) => ({
      appId: app.appId,
      title: app.title,
      icon: app.icon,
    }));
  }

  return [];
}
