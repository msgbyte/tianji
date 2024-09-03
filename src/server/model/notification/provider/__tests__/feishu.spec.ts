import { describe, test } from 'vitest';
import { token } from '../../token/index.js';
import { feishu } from '../feishu.js';

describe.runIf(!!process.env.TEST_FEISHU_URL)('feishu', () => {
  test('apprise should be work', async () => {
    await feishu.send(
      {
        payload: {
          webhookUrl: process.env.TEST_FEISHU_URL,
        },
      } as any,
      'test title',
      [
        token.title('test title', 1),
        token.text('list'),
        token.newline(),
        token.list([[token.text('A')], [token.text('B')]]),
      ]
    );
  });
});
