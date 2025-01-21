import axios from 'axios';
import { markReviewAsPublished, reviewPublished } from './reviews';
import { regions } from './regions';
import { AppInformation, AppstoreConfig, Review } from './types';
import { postToTianji } from './tianji';

const DEFAULT_INTERVAL_SECONDS = 3600;

export const startReview = (
  config: AppstoreConfig,
  firstRun: boolean
): void => {
  if (config.regions === true) {
    try {
      config.regions = regions;
    } catch (err) {
      config.regions = ['us'];
    }
  }

  config.regions = config.regions || ['us'];
  config.interval = config.interval || DEFAULT_INTERVAL_SECONDS;

  config.regions.forEach((region, i) => {
    fetchAppInformation(config, region, (globalAppInformation) => {
      const appInformation = { ...globalAppInformation };

      fetchAppStoreReviews(config, appInformation, (reviews) => {
        if (firstRun) {
          reviews.forEach((review) => markReviewAsPublished(config, review));

          if (config.dryRun && reviews.length > 0) {
            publishReview(
              appInformation,
              config,
              reviews[reviews.length - 1],
              true
            );
          }
        } else {
          handleFetchedAppStoreReviews(config, appInformation, reviews);
        }

        const intervalSeconds =
          (config.interval ?? DEFAULT_INTERVAL_SECONDS) + i * 10;

        setInterval(() => {
          if (config.verbose) {
            console.log(`INFO: [${config.appId}] Fetching App Store reviews`);
          }

          fetchAppStoreReviews(config, appInformation, (reviews) => {
            handleFetchedAppStoreReviews(config, appInformation, reviews);
          });
        }, intervalSeconds * 1000);
      });
    });
  });
};

const fetchAppStoreReviewsByPage = (
  config: AppstoreConfig,
  appInformation: AppInformation,
  page: number,
  callback: (reviews: Review[]) => void
): void => {
  const url = `https://itunes.apple.com/${appInformation.region}/rss/customerreviews/page=${page}/id=${config.appId}/sortBy=mostRecent/json`;

  axios
    .get(url)
    .then((res) => {
      const rss = res.data;
      const entries = rss.feed.entry;
      if (!entries || entries.length === 0) {
        if (config.verbose) {
          console.log(
            `INFO: No reviews from App Store (${config.appId}) (${appInformation.region})`
          );
        }
        callback([]);
        return;
      }

      if (config.verbose) {
        console.log(
          `INFO: Received reviews from App Store (${config.appId}) (${appInformation.region})`
        );
      }

      const reviews = entries
        .filter((entry: any) => !isAppInformationEntry(entry))
        .reverse()
        .map((entry: any) => parseAppStoreReview(entry, appInformation));

      callback(reviews);
    })
    .catch((error) => {
      if (config.verbose) {
        console.error(
          `ERROR: Error fetching reviews from App Store (${config.appId}) (${appInformation.region})`,
          error
        );
      }
      callback([]);
    });
};

export const fetchAppStoreReviews = (
  config: AppstoreConfig,
  appInformation: AppInformation,
  callback: (reviews: Review[]) => void
): void => {
  let page = 1;
  const allReviews: Review[] = [];

  const pageCallback = (reviews: Review[]): void => {
    allReviews.push(...reviews);
    if (reviews.length > 0 && page < 10) {
      page++;
      fetchAppStoreReviewsByPage(config, appInformation, page, pageCallback);
    } else {
      callback(allReviews);
    }
  };

  fetchAppStoreReviewsByPage(config, appInformation, page, pageCallback);
};

export const handleFetchedAppStoreReviews = (
  config: AppstoreConfig,
  appInformation: AppInformation,
  reviews: Review[]
): void => {
  if (config.verbose) {
    console.log(
      `INFO: Handling fetched reviews for (${config.appId}) (${appInformation.region})`
    );
  }
  reviews.forEach((review) =>
    publishReview(appInformation, config, review, false)
  );
};

const parseAppStoreReview = (
  rssItem: any,
  appInformation: AppInformation
): Review => {
  return {
    id: rssItem.id.label,
    version: rssItem['im:version']?.label,
    title: rssItem.title.label,
    text: rssItem.content.label,
    rating: parseInt(rssItem['im:rating']?.label || '-1', 10),
    author: rssItem.author?.name.label || '',
    link: rssItem.author?.uri.label || appInformation.appLink || '',
    storeName: 'App Store',
  };
};

const publishReview = (
  appInformation: AppInformation,
  config: AppstoreConfig,
  review: Review,
  force: boolean
): void => {
  if (!reviewPublished(config, review) || force) {
    if (config.verbose) {
      console.log(`INFO: New review: ${JSON.stringify(review)}`);
    }

    postToTianji(review, config, appInformation);
    markReviewAsPublished(config, review);
  } else {
    if (config.verbose) {
      console.log(`INFO: Review already published: ${review.text}`);
    }
  }
};

export const fetchAppInformation = (
  config: AppstoreConfig,
  region: string,
  callback: (info: AppInformation) => void
): void => {
  const url = `https://itunes.apple.com/lookup?id=${config.appId}&country=${region}`;
  const appInformation: AppInformation = {
    // appName: config.appName,
    // appIcon: config.appIcon,
    // appLink: config.appLink,
    appName: '',
    appIcon: '',
    appLink: '',
    region,
  };

  axios
    .get(url)
    .then(({ data }) => {
      const entries = data.results;
      if (!entries || entries.length === 0) {
        if (config.verbose)
          console.log(`INFO: No data from App Store (${config.appId})`);
        callback(appInformation);
        return;
      }

      if (config.verbose)
        console.log(`INFO: Received app data from App Store (${config.appId})`);
      const entry = entries[0];
      appInformation.appName =
        appInformation.appName || entry.trackCensoredName;
      appInformation.appIcon = appInformation.appIcon || entry.artworkUrl100;
      appInformation.appLink = appInformation.appLink || entry.trackViewUrl;

      callback(appInformation);
    })
    .catch((error) => {
      if (config.verbose) {
        console.error(
          `ERROR: Error fetching app data from App Store (${config.appId})`,
          error
        );
      }
      callback(appInformation);
    });
};

const isAppInformationEntry = (entry: any): boolean => {
  return !!entry['im:name'];
};
