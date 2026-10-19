import type { Tweet, TweetEntities } from 'react-tweet/api';

export function normalizeTweetForReactTweet<T extends Tweet>(tweet: T): T {
  return {
    ...tweet,
    entities: normalizeTweetEntities(tweet.entities),
    quoted_tweet: tweet.quoted_tweet
      ? {
          ...tweet.quoted_tweet,
          entities: normalizeTweetEntities(tweet.quoted_tweet.entities),
        }
      : tweet.quoted_tweet,
  };
}

function normalizeTweetEntities(
  entities: Partial<TweetEntities> = {}
): TweetEntities {
  const media =
    Array.isArray(entities.media) && entities.media.length > 0
      ? entities.media
      : undefined;

  return {
    ...entities,
    hashtags: Array.isArray(entities.hashtags) ? entities.hashtags : [],
    urls: Array.isArray(entities.urls) ? entities.urls : [],
    user_mentions: Array.isArray(entities.user_mentions)
      ? entities.user_mentions
      : [],
    symbols: Array.isArray(entities.symbols) ? entities.symbols : [],
    ...(media ? { media } : {}),
  };
}
