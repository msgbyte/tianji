import * as reviews from './reviews';
import { Config } from './types';

export function start(config: Config) {
  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i];

    reviews.start({
      verbose: config.verbose,
      dryRun: config.dryRun,
      interval: config.interval,
      tianji: config.tianji,

      // @ts-ignore
      publisherKey: app.publisherKey,
      appId: app.appId,
      store: app.store,
      // @ts-ignore
      regions: app.regions,
    });
  }
}

start({
  tianji: {
    baseUrl: 'https://tianji.flowgpt.com',
    workspaceId: 'clnzoxcy10001vy2ohi4obbi0',
    surveyId: 'cm658i2tqw96upkejldn8rpbs',
  },
  apps: [
    {
      store: 'google-play',
      appId: 'com.flow.mobile',
      publisherKey: './publisher.json',
    },
    {
      store: 'app-store',
      appId: '6476081894',
      regions: ['us'],
    },
  ],
  verbose: true,
});
