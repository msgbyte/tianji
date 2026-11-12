import express from 'express';
import 'express-async-errors';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../../model/_client.js';
import { upsertApplicationUser } from '../../model/application/user.js';
import { applicationRouter } from './application.js';
import { applicationRouter as ingestionRouter } from '../../router/application.js';

const mocks = vi.hoisted(() => ({ getWorkspaceUser: vi.fn() }));
vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: () => ({ id: 'user-id', username: 'user', role: 'user' }),
}));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../../model/billing/workspace.js', () => ({
  isWorkspacePaused: async () => false,
}));
vi.mock('../../utils/detect.js', () => ({
  getClientInfo: async (req: express.Request) => ({
    ip: '127.0.0.1',
    userAgent: req.headers['user-agent'],
  }),
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => vi.fn() },
  promApplicationEventCounter: { inc: vi.fn() },
}));

const caller = applicationRouter.createCaller({
  token: 'test-token',
  timezone: 'utc',
  language: 'en',
  req: {} as any,
  origin: '',
});
const app = supertest(
  express().use(express.json()).use('/application', ingestionRouter)
);
let workspaceId: string;
let applicationId: string;
const workspaces: string[] = [];

beforeEach(async () => {
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'read' });
  const workspace = await prisma.workspace.create({
    data: { name: 'Identify test' },
  });
  workspaceId = workspace.id;
  workspaces.push(workspaceId);
  applicationId = (
    await prisma.application.create({
      data: { workspaceId, name: 'Application' },
    })
  ).id;
});

afterEach(async () => {
  await prisma.workspace.deleteMany({
    where: { id: { in: workspaces.splice(0) } },
  });
});

async function identify(
  data: object,
  endpoint = 'send',
  userAgent = 'TestDevice/1.0'
) {
  const item = {
    type: 'identify',
    payload: { application: applicationId, data },
  };
  const result = await app
    .post(`/application/${endpoint}`)
    .set('user-agent', userAgent)
    .send(endpoint === 'batch' ? { events: [item] } : item);
  expect(result.status).toBe(200);
  if (endpoint === 'batch') expect(result.body.errors).toBe(0);
}

const users = (
  filter?: { field: string; value: boolean | string | number | null },
  pageSize = 20,
  page = 1
) => caller.users({ workspaceId, applicationId, filter, pageSize, page });

describe('Identify user counts', () => {
  test.each(['send', 'batch'])(
    '%s deduplicates IDs across sessions and preserves partial updates',
    async (endpoint) => {
      await identify({ id: 'member', joinedGroup: true }, endpoint);
      await identify(
        { id: 'member', joinedGroup: true },
        endpoint,
        'OtherDevice/2.0'
      );
      await identify({ id: 'member', plan: 'premium' }, endpoint);
      await identify({ userId: 'second-member', joinedGroup: true }, endpoint);
      await identify({ os: 'android', version: '1.0' }, endpoint);
      let result = await users({ field: 'joinedGroup', value: true });
      expect(result.total).toBe(2);
      expect(result.identifiedTotal).toBe(2);
      expect(
        result.items.find((user) => user.userId === 'member')?.properties
      ).toMatchObject({ joinedGroup: true, plan: 'premium' });

      await identify({ id: 'member', joinedGroup: false }, endpoint);
      result = await users({ field: 'joinedGroup', value: true });
      expect(result.total).toBe(1);
      expect(result.items[0].userId).toBe('second-member');
      expect((await users({ field: 'joinedGroup', value: false })).total).toBe(
        1
      );
    }
  );

  test('distinguishes typed values, null and missing fields and counts beyond a page', async () => {
    for (const [id, properties] of Object.entries({
      boolean1: { joinedGroup: true },
      boolean2: { joinedGroup: true },
      string: { joinedGroup: 'true' },
      missing: {},
      cleared: { joinedGroup: null },
      number: { joinedGroup: 1 },
      nested: { groups: { beta: true } },
      array: { joinedGroup: [true] },
      emptyKey: { '': true },
    }))
      await identify({ id, ...properties });
    const result = await users({ field: 'joinedGroup', value: true }, 1);
    expect(result).toMatchObject({ total: 2, identifiedTotal: 9 });
    expect(result.items).toHaveLength(1);
    const next = await users({ field: 'joinedGroup', value: true }, 1, 2);
    expect(next.total).toBe(2);
    expect(next.items[0].userId).not.toBe(result.items[0].userId);
    expect((await users({ field: 'joinedGroup', value: 'true' })).total).toBe(
      1
    );
    expect((await users({ field: 'joinedGroup', value: null })).total).toBe(1);
    expect((await users({ field: 'joinedGroup', value: 1 })).total).toBe(1);
    expect((await users({ field: 'groups.beta', value: true })).total).toBe(1);
    expect(await caller.userFields({ workspaceId, applicationId })).toEqual([
      'groups.beta',
      'id',
      'joinedGroup',
    ]);
  });

  test('bounds field suggestions to recent users while counting all matching users', async () => {
    await prisma.applicationUser.create({
      data: {
        applicationId,
        userId: 'older-member',
        properties: { rareGroup: true, sharedGroup: true },
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    });
    await prisma.applicationUser.createMany({
      data: Array.from({ length: 1000 }, (_, index) => ({
        applicationId,
        userId: `recent-member-${index}`,
        properties: { joinedGroup: true, sharedGroup: true },
        updatedAt: new Date('2026-11-01T00:00:00Z'),
      })),
    });

    expect(await caller.userFields({ workspaceId, applicationId })).toEqual([
      'joinedGroup',
      'sharedGroup',
    ]);
    const rareGroup = await users({ field: 'rareGroup', value: true });
    expect(rareGroup).toMatchObject({ total: 1, identifiedTotal: 1001 });
    expect(rareGroup.items[0].userId).toBe('older-member');
    expect((await users({ field: 'sharedGroup', value: true })).total).toBe(
      1001
    );
  });

  test('caps accessible pages while preserving the full matching count', async () => {
    // Simulate a large database result without inserting millions of profiles.
    const transaction = vi
      .spyOn(prisma, '$transaction')
      .mockResolvedValueOnce([[], [{ total: 20_000_001n }], 20_000_001]);
    try {
      const result = await users();
      expect(result).toMatchObject({
        total: 20_000_001,
        identifiedTotal: 20_000_001,
        totalPages: 1_000_000,
      });
      await expect(
        users(undefined, 20, result.totalPages)
      ).resolves.toMatchObject({
        items: [],
        total: 0,
        totalPages: 0,
      });
      await expect(
        users(undefined, 20, result.totalPages + 1)
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    } finally {
      transaction.mockRestore();
    }
  });

  test('applies ordered batch updates and clears a previously reported property', async () => {
    const result = await app.post('/application/batch').send({
      events: [
        { id: 'member', joinedGroup: true, groups: { beta: true } },
        { id: 'member', joinedGroup: false },
        { id: 'member', joinedGroup: null, groups: { beta: null } },
      ].map((data) => ({
        type: 'identify',
        payload: { application: applicationId, data },
      })),
    });
    expect(result.body).toMatchObject({ processed: 3, errors: 0 });
    expect((await users({ field: 'joinedGroup', value: true })).total).toBe(0);
    expect((await users({ field: 'joinedGroup', value: null })).total).toBe(1);
    expect((await users({ field: 'groups.beta', value: null })).total).toBe(1);
  });

  test('merges concurrent updates and keeps application identities separate', async () => {
    await identify({ id: 'member', userId: 'alias', joinedGroup: true });
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        upsertApplicationUser(applicationId, { id: 'member', [`field${i}`]: i })
      )
    );
    const other = await prisma.application.create({
      data: { workspaceId, name: 'Other' },
    });
    await upsertApplicationUser(other.id, { id: 'member', joinedGroup: false });
    const result = await users({ field: 'joinedGroup', value: true });
    expect(result.total).toBe(1);
    expect(result.items[0].userId).toBe('member');
    expect(result.items[0].properties).toMatchObject(
      Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`field${i}`, i]))
    );
  });

  test('rejects invalid identities and invalid filters without updating membership', async () => {
    for (const id of ['', ' ', 42, true, {}, 'x'.repeat(501)]) {
      const result = await app.post('/application/send').send({
        type: 'identify',
        payload: {
          application: applicationId,
          data: { id, joinedGroup: true },
        },
      });
      expect(result.status).toBe(400);
    }
    expect((await users()).total).toBe(0);
    await expect(users({ field: '', value: true })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    await expect(users(undefined, 101)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  test('denies foreign workspaces, deleted applications, and non-members', async () => {
    await identify({ id: 'member', joinedGroup: true });
    const foreign = await prisma.workspace.create({
      data: { name: 'Foreign' },
    });
    workspaces.push(foreign.id);
    for (const method of ['users', 'userFields'] as const) {
      await expect(
        caller[method]({ workspaceId: foreign.id, applicationId })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      mocks.getWorkspaceUser.mockResolvedValueOnce(null);
      await expect(
        caller[method]({ workspaceId, applicationId })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
    await prisma.application.update({
      where: { id: applicationId },
      data: { deletedAt: new Date() },
    });
    for (const method of ['users', 'userFields'] as const) {
      await expect(
        caller[method]({ workspaceId, applicationId })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }
  });
});
