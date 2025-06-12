import { google } from 'googleapis';
// @ts-ignore
import playScraper from 'google-play-scraper';
import fs from 'fs';
import { markReviewAsPublished, reviewPublished } from './reviews';
import { DEFAULT_INTERVAL_SECONDS } from './const';
import { AppInformation, GooglePlayConfig, Review } from './types';
import { postToTianji } from './tianji';

export const startReview = async (
  config: GooglePlayConfig,
  firstRun: boolean
): Promise<void> => {
  const appInformation: AppInformation = {
    appName: '',
    appIcon: '',
  };

  try {
    // Scrape Google Play for app information
    const appData = await playScraper.app({ appId: config.appId });
    appInformation.appName = appData.title;
    appInformation.appIcon = appData.icon;

    try {
      const reviews = await fetchGooglePlayReviews(config, appInformation);
      if (firstRun) {
        reviews.forEach((review) => {
          markReviewAsPublished(config, review);
        });

        if (config.dryRun && reviews.length > 0) {
          publishReview(
            appInformation,
            config,
            reviews[reviews.length - 1],
            true
          );
        }
      } else {
        handleFetchedGooglePlayReviews(config, appInformation, reviews);
      }
    } catch (error) {
      if (config.verbose) {
        console.error(
          `ERROR: Failed to fetch Google Play reviews (${config.appId})`,
          error
        );
      }
    }

    const intervalSeconds = config.interval || DEFAULT_INTERVAL_SECONDS;
    setInterval(async () => {
      if (config.verbose)
        console.log(`INFO: [${config.appId}] Fetching Google Play reviews`);

      try {
        const reviews = await fetchGooglePlayReviews(config, appInformation);
        handleFetchedGooglePlayReviews(config, appInformation, reviews);
      } catch (error) {
        if (config.verbose) {
          console.error(
            `ERROR: Failed to fetch Google Play reviews during interval (${config.appId})`,
            error
          );
        }
      }
    }, intervalSeconds * 1000);
  } catch (error) {
    console.error(
      `ERROR: [${config.appId}] Could not scrape Google Play, ${error}`
    );
  }
};

const publishReview = (
  appInformation: AppInformation,
  config: GooglePlayConfig,
  review: Review,
  force: boolean
): void => {
  if (!reviewPublished(config, review) || force) {
    if (config.verbose) {
      console.log(`INFO: Received new review: ${JSON.stringify(review)}`);
    }

    postToTianji(review, config, appInformation);
    markReviewAsPublished(config, review);
  } else {
    if (config.verbose)
      console.log(`INFO: Review already published: ${review.text}`);
  }
};

export const handleFetchedGooglePlayReviews = (
  config: GooglePlayConfig,
  appInformation: AppInformation,
  reviews: Review[]
): void => {
  if (config.verbose) {
    console.log(`INFO: [${config.appId}] Handling fetched reviews`);
  }

  reviews.forEach((review) => {
    publishReview(appInformation, config, review, false);
  });
};

export const fetchGooglePlayReviews = (
  config: GooglePlayConfig,
  appInformation: AppInformation
): Promise<Review[]> => {
  return new Promise((resolve, reject) => {
    if (config.verbose)
      console.log(`INFO: Fetching Google Play reviews for ${config.appId}`);

    const scopes = ['https://www.googleapis.com/auth/androidpublisher'];
    let publisherJson: any;

    if (typeof config.publisherKey === 'object') {
      publisherJson = config.publisherKey;
    } else {
      try {
        publisherJson = JSON.parse(
          fs.readFileSync(config.publisherKey, 'utf8')
        );
      } catch (e) {
        console.warn(e);
        reject(e);
        return;
      }
    }

    let jwt;
    try {
      jwt = new google.auth.JWT(
        publisherJson.client_id,
        undefined,
        publisherJson.private_key,
        scopes
      );
    } catch (e) {
      console.warn(e);
      reject(e);
      return;
    }

    jwt.authorize((err) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      google.androidpublisher('v3').reviews.list(
        {
          auth: jwt,
          packageName: config.appId,
        },
        (err, resp) => {
          if (err) {
            console.error(
              `ERROR: [${config.appId}] Could not fetch Google Play reviews, ${err}`
            );
            reject(err);
            return;
          }

          if (config.verbose)
            console.log(
              `INFO: [${config.appId}] Received reviews from Google Play`
            );

          if (!resp?.data?.reviews) {
            resolve([]);
            return;
          }

          const reviews = resp.data.reviews.map((review) => {
            const comment = review.comments?.[0].userComment;

            return {
              id: String(review.reviewId),
              author: String(review.authorName),
              version: String(comment?.appVersionName),
              versionCode: Number(comment?.appVersionCode),
              osVersion: Number(comment?.androidOsVersion),
              device: String(comment?.deviceMetadata?.productName),
              text: String(comment?.text),
              rating: Number(comment?.starRating),
              link: `https://play.google.com/store/apps/details?id=${config.appId}&reviewId=${review.reviewId}`,
              storeName: 'Google Play',
            } satisfies Review;
          });

          resolve(reviews);
        }
      );
    });
  });
};
