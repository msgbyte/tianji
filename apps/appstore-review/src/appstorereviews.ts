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

  config.regions.forEach(async (region, i) => {
    try {
      const globalAppInformation = await fetchAppInformation(config, region);
      const appInformation = { ...globalAppInformation };

      try {
        const reviews = await fetchAppStoreReviews(config, appInformation);
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
      } catch (error) {
        if (config.verbose) {
          console.error(
            `ERROR: Failed to fetch App Store reviews (${config.appId}) (${appInformation.region})`,
            error
          );
        }
      }

      const intervalSeconds =
        (config.interval ?? DEFAULT_INTERVAL_SECONDS) + i * 10;

      setInterval(async () => {
        if (config.verbose) {
          console.log(`INFO: [${config.appId}] Fetching App Store reviews`);
        }

        try {
          const reviews = await fetchAppStoreReviews(config, appInformation);
          handleFetchedAppStoreReviews(config, appInformation, reviews);
        } catch (error) {
          if (config.verbose) {
            console.error(
              `ERROR: Failed to fetch App Store reviews during interval (${config.appId}) (${appInformation.region})`,
              error
            );
          }
        }
      }, intervalSeconds * 1000);
    } catch (error) {
      if (config.verbose) {
        console.error(
          `ERROR: Failed to fetch app information (${config.appId}) (${region})`,
          error
        );
      }
    }
  });
};

const fetchAppStoreReviewsByPage = (
  config: AppstoreConfig,
  appInformation: AppInformation,
  page: number
): Promise<Review[]> => {
  const url = `https://itunes.apple.com/${appInformation.region}/rss/customerreviews/page=${page}/id=${config.appId}/sortBy=mostRecent/json`;

  return axios
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
        return [];
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

      return reviews;
    })
    .catch((error) => {
      if (config.verbose) {
        console.error(
          `ERROR: Error fetching reviews from App Store (${config.appId}) (${appInformation.region})`,
          error
        );
      }
      return [];
    });
};

export const fetchAppStoreReviews = async (
  config: AppstoreConfig,
  appInformation: AppInformation
): Promise<Review[]> => {
  let page = 1;
  const allReviews: Review[] = [];

  while (page <= 10) {
    try {
      const reviews = await fetchAppStoreReviewsByPage(
        config,
        appInformation,
        page
      );
      allReviews.push(...reviews);

      if (reviews.length === 0) {
        break;
      }
    } catch (error) {
      if (config.verbose) {
        console.error(
          `ERROR: Failed to fetch App Store reviews for page ${page} (${config.appId}) (${appInformation.region})`,
          error
        );
      }
      // Continue to next page even if current page fails
    }

    page++;
  }

  return allReviews;
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
  region: string
): Promise<AppInformation> => {
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

  return axios
    .get(url)
    .then(({ data }) => {
      const entries = data.results;
      if (!entries || entries.length === 0) {
        if (config.verbose)
          console.log(`INFO: No data from App Store (${config.appId})`);
        return appInformation;
      }

      if (config.verbose)
        console.log(`INFO: Received app data from App Store (${config.appId})`);
      const entry = entries[0];
      appInformation.appName =
        appInformation.appName || entry.trackCensoredName;
      appInformation.appIcon = appInformation.appIcon || entry.artworkUrl100;
      appInformation.appLink = appInformation.appLink || entry.trackViewUrl;

      return appInformation;
    })
    .catch((error) => {
      if (config.verbose) {
        console.error(
          `ERROR: Error fetching app data from App Store (${config.appId})`,
          error
        );
      }
      return appInformation;
    });
};

const isAppInformationEntry = (entry: any): boolean => {
  return !!entry['im:name'];
};
