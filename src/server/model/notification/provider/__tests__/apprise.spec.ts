import { describe, test } from 'vitest';
import { apprise } from '../apprise';
import { token } from '../../token';

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
