import * as appstore from './appstorereviews';
import * as googlePlay from './googleplayreviews';
import fs from 'fs';
import { AppstoreConfig, GooglePlayConfig } from './types';

interface Review {
  id: string;
}

const REVIEWS_LIMIT = 5000;

let publishedReviews: Record<string, string[]>;

try {
  publishedReviews = JSON.parse(
    fs.readFileSync('./published_reviews.json', 'utf8')
  );
} catch (err) {
  publishedReviews = {};
}

export const start = (config: AppstoreConfig | GooglePlayConfig): void => {
  if (config.store === 'app-store') {
    appstore.startReview(config, !publishedReviews[config.appId]);
    console.log('Start Review:', config.store, config.appId);
  } else {
    googlePlay.startReview(config, !publishedReviews[config.appId]);
    console.log('Start Review:', config.store, config.appId);
  }
};

export const markReviewAsPublished = (
  config: AppstoreConfig | GooglePlayConfig,
  review: Review
): void => {
  if (!review || !review.id || reviewPublished(config, review)) return;

  if (!publishedReviews[config.appId]) {
    publishedReviews[config.appId] = [];
  }

  if (config.verbose) {
    console.log(
      `INFO: Checking if we need to prune published reviews have (${publishedReviews[config.appId].length}) limit (${REVIEWS_LIMIT})`
    );
  }

  if (publishedReviews[config.appId].length >= REVIEWS_LIMIT) {
    publishedReviews[config.appId] = publishedReviews[config.appId].slice(
      0,
      REVIEWS_LIMIT
    );
  }

  publishedReviews[config.appId].unshift(review.id);

  if (config.verbose) {
    console.log(
      `INFO: Review marked as published: ${JSON.stringify(publishedReviews[config.appId])}`
    );
  }

  fs.writeFileSync(
    './published_reviews.json',
    JSON.stringify(publishedReviews),
    { flag: 'w' }
  );
};

export const reviewPublished = (
  config: AppstoreConfig | GooglePlayConfig,
  review: Review
): boolean => {
  if (!review || !review.id || !publishedReviews[config.appId]) {
    return false;
  }

  return publishedReviews[config.appId].includes(review.id);
};

export const getPublishedReviews = (): Record<string, string[]> => {
  return publishedReviews;
};

export const resetPublishedReviews = (): Record<string, string[]> => {
  publishedReviews = {};
  return publishedReviews;
};
