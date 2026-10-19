import assert from 'node:assert/strict';
import test from 'node:test';
import type { Tweet } from 'react-tweet/api';
import { enrichTweet } from '../../../node_modules/react-tweet/dist/utils.js';

import { normalizeTweetForReactTweet } from './tweet-utils';

const tweetWithSparseEntities = {
  __typename: 'Tweet',
  favorite_count: 5,
  lang: 'en',
  possibly_sensitive: false,
  created_at: '2025-01-08T13:21:01.000Z',
  display_text_range: [0, 24],
  entities: {
    urls: [
      {
        display_url: 'example.com',
        expanded_url: 'https://example.com',
        indices: [13, 24],
        url: 'https://t.co/example',
      },
    ],
  },
  id_str: '1876982441312751667',
  text: 'Tianji works https://t.co/example',
  user: {
    id_str: '95831222',
    name: 'Tianji User',
    screen_name: 'tianji_user',
    is_blue_verified: false,
    profile_image_shape: 'Circle',
    verified: false,
    profile_image_url_https: 'https://example.com/avatar.jpg',
  },
  edit_control: {
    edit_tweet_ids: ['1876982441312751667'],
    editable_until_msecs: '1736346061000',
    edits_remaining: '5',
    is_edit_eligible: false,
  },
  mediaDetails: [],
  conversation_count: 2,
  news_action_type: 'conversation',
  isEdited: false,
  isStaleEdit: false,
} as unknown as Tweet;

test('fills missing tweet entity arrays before react-tweet enrichment', () => {
  const normalized = normalizeTweetForReactTweet(tweetWithSparseEntities);

  assert.doesNotThrow(() => enrichTweet(normalized));
  assert.deepEqual(normalized.entities.hashtags, []);
  assert.deepEqual(normalized.entities.user_mentions, []);
  assert.deepEqual(normalized.entities.symbols, []);
  assert.equal('media' in normalized.entities, false);
});
