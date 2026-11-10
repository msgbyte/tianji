import { describe, expect, test } from 'vitest';
import { createTestContext } from '../../tests/utils.js';
import { prisma } from '../../model/_client.js';

describe('OS version ingestion', () => {
  const { app, createTestWorkspace } = createTestContext();

  async function createTarget(kind: 'website' | 'application') {
    const workspace = await createTestWorkspace();
    return kind === 'website'
      ? prisma.website.create({
          data: {
            workspaceId: workspace.id,
            name: 'Website',
            domain: 'example.com',
          },
        })
      : prisma.application.create({
          data: { workspaceId: workspace.id, name: 'Application' },
        });
  }

  async function readSession(kind: 'website' | 'application', id: string) {
    return kind === 'website'
      ? prisma.websiteSession.findFirstOrThrow({ where: { websiteId: id } })
      : prisma.applicationSession.findFirstOrThrow({
          where: { applicationId: id },
        });
  }

  for (const kind of ['website', 'application'] as const) {
    test.each(['send', 'batch'])(
      `${kind} %s accepts legacy clients and enriches cached sessions`,
      async (endpoint) => {
        const target = await createTarget(kind);
        const payload = {
          [kind]: target.id,
          hostname: 'example.com',
          os: 'android',
          data: { plan: 'pro' },
        };
        const send = (version?: string, token?: string) => {
          const item = {
            type: 'identify',
            payload: { ...payload, ...(version ? { osVersion: version } : {}) },
          };
          const req = app
            .post(`/api/${kind}/${endpoint}`)
            .set('user-agent', 'TestBrowser/1.0');
          if (token) req.set('x-tianji-cache', token);
          return req.send(endpoint === 'batch' ? { events: [item] } : item);
        };

        const legacy = await send();
        expect(legacy.status).toBe(200);
        const initial = await readSession(kind, target.id);
        expect(initial.osVersion).toBeNull();
        const token = endpoint === 'batch' ? legacy.body.token : legacy.text;

        const enriched = await send('14', token);
        expect(enriched.status).toBe(200);
        expect(await readSession(kind, target.id)).toMatchObject({
          id: initial.id,
          osVersion: '14',
        });

        expect((await send(undefined, token)).status).toBe(200);
        expect((await readSession(kind, target.id)).osVersion).toBe('14');
      }
    );

    test.each(['send', 'batch'])(
      `${kind} %s rejects non-string and oversized OS versions`,
      async (endpoint) => {
        const target = await createTarget(kind);
        for (const osVersion of [14, 'x'.repeat(21)]) {
          const item = {
            type: 'event',
            payload: { [kind]: target.id, hostname: 'example.com', osVersion },
          };
          const res = await app
            .post(`/api/${kind}/${endpoint}`)
            .send(endpoint === 'batch' ? { events: [item] } : item);
          expect(res.status).toBe(422);
        }
      }
    );
  }

  test('uses the website user agent only until an explicit version is recorded', async () => {
    const website = await createTarget('website');
    const payload = {
      website: website.id,
      hostname: 'example.com',
      data: { plan: 'pro' },
    };
    const send = (extra: object = {}, token?: string) => {
      const req = app
        .post('/api/website/send')
        .set('user-agent', 'TestBrowser/1.0 (Linux; Android 14; Pixel 8)');
      if (token) req.set('x-tianji-cache', token);
      return req.send({ type: 'identify', payload: { ...payload, ...extra } });
    };
    const first = await send();
    expect(first.status).toBe(200);
    expect((await readSession('website', website.id)).osVersion).toBe('14');
    expect((await send({ osVersion: '14.0.1' }, first.text)).status).toBe(200);
    expect((await send({}, first.text)).status).toBe(200);
    expect((await readSession('website', website.id)).osVersion).toBe('14.0.1');
  });

  test.each(['send', 'batch'])(
    'application %s stores native identify metadata separately from app version',
    async (endpoint) => {
      const application = await createTarget('application');
      const item = {
        type: 'identify',
        payload: {
          application: application.id,
          data: { os: 'android', osVersion: '14', version: '2.0' },
        },
      };
      const res = await app
        .post(`/api/application/${endpoint}`)
        .send(endpoint === 'batch' ? { events: [item] } : item);
      expect(res.status).toBe(200);
      if (endpoint === 'batch') expect(res.body.errors).toBe(0);
      expect(await readSession('application', application.id)).toMatchObject({
        os: 'android',
        osVersion: '14',
        version: '2.0',
      });
    }
  );

  test('rejects invalid native identify metadata', async () => {
    const application = await createTarget('application');
    const res = await app.post('/api/application/send').send({
      type: 'identify',
      payload: { application: application.id, data: { osVersion: 14 } },
    });
    expect(res.status).toBe(400);
    expect(
      (await readSession('application', application.id)).osVersion
    ).toBeNull();
  });

  test('does not use another application token to update its OS version', async () => {
    const first = await createTarget('application');
    const second = await createTarget('application');
    const res = await app.post('/api/application/send').send({
      type: 'identify',
      payload: { application: first.id, osVersion: '13', data: {} },
    });
    expect(res.status).toBe(200);
    const next = await app
      .post('/api/application/send')
      .set('x-tianji-cache', res.text)
      .send({
        type: 'identify',
        payload: { application: second.id, osVersion: '14', data: {} },
      });
    expect(next.status).toBe(200);
    expect((await readSession('application', first.id)).osVersion).toBe('13');
    expect((await readSession('application', second.id)).osVersion).toBe('14');
  });

});
