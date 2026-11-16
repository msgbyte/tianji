import { describe, expect, test } from 'vitest';
import gplay from 'google-play-scraper';

describe('storeInfo', () => {
  test.runIf(process.env.GOOGLEPLAY_STORE_ID)(
    'finds an app by its Google Play package ID',
    async () => {
      const apps = await gplay.search({
        term: process.env.GOOGLEPLAY_STORE_ID!,
        num: 20,
      });

      expect(apps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            appId: process.env.GOOGLEPLAY_STORE_ID!,
            title: expect.any(String),
            icon: expect.any(String),
          }),
        ])
      );
    },
    30_000
  );

  test.runIf(process.env.GOOGLEPLAY_STORE_ID)('google play', async () => {
    const res = await gplay.app({
      appId: process.env.GOOGLEPLAY_STORE_ID!,
    });

    const info = {
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

    expect(info).not.toBeNull();
    expect(res).not.toBeNull();
  });
});
