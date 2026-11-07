import { beforeEach, describe, expect, test, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
} from 'trpc-to-openapi';

const mocks = vi.hoisted(() => ({
  membership: vi.fn(),
  verifyKey: vi.fn(),
  audit: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../middleware/auth.js', () => ({ jwtVerify: vi.fn() }));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('@auth/express', () => ({ getSession: vi.fn(async () => null) }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: mocks.verifyKey }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.membership,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => () => {} },
}));
vi.mock('../../middleware/authRateLimit.js', () => ({
  authRateLimitProcedures: {},
}));
vi.mock('../../model/_client.js', () => ({
  prisma: {
    artifact: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      update: mocks.update,
      delete: mocks.delete,
    },
    workspaceAuditLog: { create: mocks.audit },
  },
}));

const { artifactRouter } = await import('./artifact.js');
const { router, createContext } = await import('../trpc.js');
const api = router({ artifact: artifactRouter });
const app = express();
app.use(express.json({ limit: '10mb' }));
app.get('/open/_document', (_req, res) =>
  res.json(
    generateOpenApiDocument(api, {
      title: 'Test',
      version: '1.0.0',
      baseUrl: '/open',
    })
  )
);
app.use(
  '/open',
  createOpenApiExpressMiddleware({ router: api, createContext })
);
const workspaceId = 'workspaceone';
const collection = `/open/workspace/${workspaceId}/artifacts`;
const endpoint = `${collection}/artifactone`;
const body = {
  title: ' Report ',
  description: 'Quarterly results',
  source:
    '<h1 title="a\\b">Informe ☀</h1>\n<script>window.ready=true</script>',
};
const actor = { id: 'authorone', username: 'author', role: 'user' };
let saved: any;
function select(row: any, fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => fields[key]));
}
function missing() {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '5.14.0',
  });
}
function call(method: 'get' | 'post' | 'put' | 'delete', url = endpoint) {
  return request(app)[method](url).set('Authorization', 'Bearer sk_test');
}
beforeEach(() => {
  vi.clearAllMocks();
  saved = undefined;
  mocks.membership.mockImplementation(async (id) =>
    id === workspaceId ? { role: 'owner' } : null
  );
  mocks.verifyKey.mockResolvedValue(actor);
  mocks.create.mockImplementation(async ({ data, select: fields }) => {
    saved = {
      id: 'artifactone',
      revision: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: { id: actor.id, username: actor.username, nickname: null },
      ...data,
    };
    return select(saved, fields);
  });
  mocks.findFirst.mockImplementation(async ({ where, select: fields }) =>
    saved && saved.id === where.id && saved.workspaceId === where.workspaceId
      ? select(saved, fields)
      : null
  );
  mocks.findMany.mockImplementation(async ({ select: fields }) =>
    saved ? [select(saved, fields)] : []
  );
  mocks.update.mockImplementation(async ({ where, data, select: fields }) => {
    if (
      !saved ||
      saved.id !== where.id ||
      saved.workspaceId !== where.workspaceId ||
      saved.revision !== where.revision
    )
      throw missing();
    saved = {
      ...saved,
      ...data,
      revision: saved.revision + data.revision.increment,
      updatedAt: new Date(),
    };
    return select(saved, fields);
  });
  mocks.delete.mockImplementation(async ({ where }) => {
    if (
      !saved ||
      saved.id !== where.id ||
      saved.workspaceId !== where.workspaceId
    )
      throw missing();
    const result = { id: saved.id };
    saved = undefined;
    return result;
  });
});

describe('Artifact OpenAPI', () => {
  test('publishes JSON HTML, returns a stable link, and lists only metadata', async () => {
    const created = await call('post', collection).send({
      ...body,
      createdById: 'impostor',
    });
    expect(created.status).toBe(200);
    expect(created.body).toMatchObject({
      title: 'Report',
      revision: 1,
      createdById: actor.id,
      path: `/artifacts/artifactone?workspaceId=${workspaceId}`,
    });
    expect(created.body.source).toBeUndefined();
    const read = await call('get');
    expect(read.body.source).toBe(body.source);
    expect(read.body.createdAt).toEqual(expect.any(String));
    const list = await call(
      'get',
      `${collection}?page=1&pageSize=50&search=Report`
    );
    expect(list.status).toBe(200);
    expect(list.body).toMatchObject({
      items: [{ title: 'Report' }],
      hasMore: false,
    });
    expect(list.body.items[0].source).toBeUndefined();
    expect(mocks.findMany.mock.calls[0][0]).toMatchObject({
      where: { workspaceId },
      skip: 0,
      take: 51,
    });
    expect(mocks.findMany.mock.calls[0][0].select.source).toBeUndefined();
  });

  test('reports more pages without returning the extra item', async () => {
    await call('post', collection).send(body);
    mocks.findMany.mockImplementation(async ({ select: fields }) => [
      select(saved, fields),
      select({ ...saved, id: 'artifacttwo' }, fields),
    ]);
    const list = await call('get', `${collection}?page=2&pageSize=1`);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.hasMore).toBe(true);
    expect(mocks.findMany.mock.calls[0][0].skip).toBe(1);
  });

  test('checks authentication and membership on every request', async () => {
    expect((await request(app).get(collection)).status).toBe(401);
    expect(
      (await call('get', '/open/workspace/workspacetwo/artifacts')).status
    ).toBe(403);
    await call('post', collection).send(body);
    mocks.membership.mockResolvedValue(null);
    for (const method of ['get', 'put', 'delete'] as const) {
      expect(
        (await call(method).send({ ...body, expectedRevision: 1 })).status
      ).toBe(403);
    }
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });

  test('enforces read, write and admin roles', async () => {
    await call('post', collection).send(body);
    mocks.membership.mockResolvedValue({ role: 'readOnly' });
    expect((await call('get')).status).toBe(200);
    expect((await call('post', collection).send(body)).status).toBe(403);
    expect(
      (await call('put').send({ ...body, expectedRevision: 1 })).status
    ).toBe(403);
    mocks.membership.mockResolvedValue({ role: 'write' });
    expect(
      (await call('put').send({ ...body, expectedRevision: 1 })).status
    ).toBe(200);
    expect((await call('delete')).status).toBe(403);
  });

  test('never exposes or mutates a different workspace artifact', async () => {
    await call('post', collection).send(body);
    saved.workspaceId = 'workspacetwo';
    for (const method of ['get', 'put', 'delete'] as const) {
      expect(
        (await call(method).send({ ...body, expectedRevision: 1 })).status
      ).toBe(404);
    }
    expect(saved.revision).toBe(1);
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });

  test('rejects stale concurrent updates without losing the winning content', async () => {
    await call('post', collection).send(body);
    const results = await Promise.all(
      ['first', 'second'].map((title) =>
        call('put').send({ ...body, title, expectedRevision: 1 })
      )
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(saved.revision).toBe(2);
    expect(saved.title).toBe(results.find((r) => r.status === 200)!.body.title);
    expect(mocks.audit).toHaveBeenCalledTimes(2);
  });

  test('validates UTF-8 bytes and complete updates', async () => {
    for (const invalid of [
      { title: ' ' },
      { title: 'x'.repeat(201) },
      { description: 'x'.repeat(2001) },
      { source: '\n ' },
      { source: 'é'.repeat(524289) },
    ]) {
      expect(
        (await call('post', collection).send({ ...body, ...invalid })).status
      ).toBe(400);
    }
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(
      (
        await call('post', collection).send({
          ...body,
          source: 'é'.repeat(524288),
        })
      ).status
    ).toBe(200);
    for (const expectedRevision of [0, -1, 1.5, 'invalid', undefined]) {
      expect(
        (await call('put').send({ ...body, expectedRevision })).status
      ).toBe(400);
    }
    const { description, ...incomplete } = body;
    expect(
      (await call('put').send({ ...incomplete, expectedRevision: 1 })).status
    ).toBe(400);
    expect((await call('get', `${collection}?page=0`)).status).toBe(400);
    expect((await call('get', `${collection}?pageSize=101`)).status).toBe(400);
    expect(
      (await call('put').send({ ...body, expectedRevision: '1' })).status
    ).toBe(200);
  });

  test('audits successful writes once with the actor and target, redacting source', async () => {
    await call('post', collection).send(body).expect(200);
    await call('put')
      .send({ ...body, expectedRevision: 1 })
      .expect(200);
    expect((await call('delete')).body).toEqual({ id: 'artifactone' });
    expect((await call('delete')).status).toBe(404);
    expect(mocks.audit).toHaveBeenCalledTimes(3);
    for (const [i, path] of ['create', 'update', 'delete'].entries()) {
      const data = mocks.audit.mock.calls[i][0].data;
      expect(data).toMatchObject({
        workspaceId,
        relatedId: 'artifactone',
        relatedType: 'Artifact',
      });
      expect(data.content).toContain(`artifact.${path}`);
      expect(data.content).toContain('author(authorone)');
      expect(data.content).not.toContain('<h1');
      if (path !== 'delete') expect(data.content).toContain('[REDACTED]');
    }
  });

  test('publishes a discoverable OpenAPI contract for all operations', () => {
    const document = generateOpenApiDocument(api, {
      title: 'Test',
      version: '1.0.0',
      baseUrl: '/open',
    });
    if (!document.paths) throw new Error('OpenAPI paths are missing');
    expect(
      Object.keys(document.paths['/workspace/{workspaceId}/artifacts']!)
    ).toEqual(expect.arrayContaining(['get', 'post']));
    expect(
      Object.keys(
        document.paths['/workspace/{workspaceId}/artifacts/{artifactId}']!
      )
    ).toEqual(expect.arrayContaining(['get', 'put', 'delete']));
  });
});
