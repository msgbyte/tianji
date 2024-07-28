import { describe, test } from 'vitest';
import { apprise } from '../apprise.js';
import { token } from '../../token/index.js';

describe.runIf(!!process.env.TEST_APPRISE_URL)('apprise', () => {
  test('apprise should be work', async () => {
    await apprise.send(
      {
        payload: {
          appriseUrl: process.env.TEST_APPRISE_URL,
        },
      } as any,
      'test title',
      [token.text('Foooo'), token.newline(), token.text('Baaaar')]
    );
  });
});
