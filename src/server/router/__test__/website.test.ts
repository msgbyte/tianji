import { afterEach, describe, expect, test, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'crypto';
import { createTestContext } from '../../tests/utils.js';
import { createToken } from '../../utils/common.js';
import { logger } from '../../utils/logger.js';

describe('website router', () => {
  const { app } = createTestContext();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns 404 and logs the website id when the website does not exist', async () => {
    const websiteId = createId();
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

    const { body, status } = await app.post('/api/website/send').send({
      type: 'event',
      payload: {
        website: websiteId,
        hostname: 'example.com',
        url: '/',
      },
    });

    expect(status).toBe(404);
    expect(body.error).toContain(`Website not found: ${websiteId}`);
    expect(
      warnSpy.mock.calls.some((call) =>
        call.some((arg) => JSON.stringify(arg).includes(websiteId))
      )
    ).toBe(true);
  });

  test('does not trust a cache token for a different website id', async () => {
    const websiteId = createId();
    const staleToken = createToken({
      id: randomUUID(),
      websiteId: createId(),
      workspaceId: createId(),
      hostname: 'example.com',
    });

    const { body, status } = await app
      .post('/api/website/send')
      .set('x-tianji-cache', staleToken)
      .send({
        type: 'event',
        payload: {
          website: websiteId,
          hostname: 'example.com',
          url: '/',
        },
      });

    expect(status).toBe(404);
    expect(body.error).toContain(`Website not found: ${websiteId}`);
  });
});
