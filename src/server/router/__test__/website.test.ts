import { afterEach, describe, expect, test, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'crypto';
import { createTestContext } from '../../tests/utils.js';
import { createToken, hashUuid } from '../../utils/common.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../model/_client.js';
import {
  findSession,
  persistWebsiteEventBatch,
} from '../../model/website/index.js';

describe('website router', () => {
  const { app, createTestWorkspace } = createTestContext();

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

  test('logs the website id when session lookup rejects the request', async () => {
    const websiteId = 'not-a-cuid';
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

    const { body, status } = await app.post('/api/website/send').send({
      type: 'event',
      payload: {
        website: websiteId,
        hostname: 'example.com',
        url: '/',
      },
    });

    expect(status).toBe(400);
    expect(body.error).toContain('Invalid website ID.');
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

  test('recreates a session when a cache token points to a stale cached session', async () => {
    const workspace = await createTestWorkspace();
    const website = await prisma.website.create({
      data: {
        name: 'Test Website',
        domain: 'example.com',
        workspaceId: workspace.id,
      },
    });
    const userAgent = 'Mozilla/5.0 Tianji Test';
    const ip = '127.0.0.1';
    const hostname = 'example.com';
    const sessionId = hashUuid(website.id, hostname, ip, userAgent);
    const req = {
      headers: {
        'cf-connecting-ip': ip,
        'user-agent': userAgent,
        'accept-language': 'en-US',
      },
    } as any;
    const body = {
      payload: {
        website: website.id,
        hostname,
        url: '/',
      },
    };

    const session = await prisma.websiteSession.create({
      data: {
        id: sessionId,
        websiteId: website.id,
        hostname,
        ip,
      },
    });
    const token = createToken({
      ...session,
      workspaceId: workspace.id,
    });

    await findSession(
      { ...req, headers: { ...req.headers, 'x-tianji-cache': token } },
      body
    );
    await prisma.websiteSession.delete({
      where: {
        id: sessionId,
      },
    });

    const recreated = await findSession(
      { ...req, headers: { ...req.headers, 'x-tianji-cache': token } },
      body
    );
    const storedSession = await prisma.websiteSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    expect(recreated.id).toBe(sessionId);
    expect(storedSession?.id).toBe(sessionId);
  });

  test('drops website events whose session was deleted before flush', async () => {
    const workspace = await createTestWorkspace();
    const website = await prisma.website.create({
      data: {
        name: 'Test Website',
        domain: 'example.com',
        workspaceId: workspace.id,
      },
    });
    const validSession = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        hostname: 'example.com',
      },
    });
    const staleSession = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        hostname: 'example.com',
      },
    });
    await prisma.websiteSession.delete({
      where: {
        id: staleSession.id,
      },
    });
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

    await persistWebsiteEventBatch([
      {
        event: {
          id: createId(),
          websiteId: website.id,
          sessionId: validSession.id,
          urlPath: '/',
        },
      },
      {
        event: {
          id: createId(),
          websiteId: website.id,
          sessionId: staleSession.id,
          urlPath: '/stale',
        },
      },
    ]);

    const events = await prisma.websiteEvent.findMany({
      where: {
        websiteId: website.id,
      },
      select: {
        sessionId: true,
        urlPath: true,
      },
    });

    expect(events).toEqual([{ sessionId: validSession.id, urlPath: '/' }]);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(
      warnSpy.mock.calls.some((call) =>
        call.some((arg) =>
          String(arg).includes(
            'Dropped 1 item(s) because their sessions no longer exist'
          )
        ) &&
        call.some((arg) => JSON.stringify(arg).includes(website.id)) &&
        call.some((arg) => JSON.stringify(arg).includes(staleSession.id))
      )
    ).toBe(true);
  });
});
