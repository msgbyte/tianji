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
