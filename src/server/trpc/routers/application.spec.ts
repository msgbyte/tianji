import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../../model/_client.js';
import { applicationRouter } from './application.js';

const mocks = vi.hoisted(() => ({
  getWorkspaceUser: vi.fn(),
}));
vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: () => ({ id: 'user-id', username: 'user', role: 'user' }),
}));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => vi.fn() },
}));

const caller = applicationRouter.createCaller({
  token: 'test-token',
  timezone: 'utc',
  language: 'en',
  req: {} as any,
  origin: '',
});
const now = new Date('2026-11-08T12:00:00Z');
const startAt = new Date('2026-11-07T12:00:00Z');
const workspaceIds: string[] = [];
let workspaceId: string;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'read' });
  const workspace = await prisma.workspace.create({
    data: { name: 'Application Overview Test' },
  });
  workspaceId = workspace.id;
  workspaceIds.push(workspaceId);
});

afterEach(async () => {
  vi.useRealTimers();
  await prisma.workspace.deleteMany({
    where: { id: { in: workspaceIds.splice(0) } },
  });
});

async function addSession(applicationId: string, eventDates: Date[]) {
  await prisma.applicationSession.create({
    data: {
      id: randomUUID(),
      applicationId,
      createdAt: new Date('2026-11-01T00:00:00Z'),
      applicationEvent: {
        create: eventDates.map((createdAt) => ({ applicationId, createdAt })),
      },
    },
  });
}

describe('applicationRouter.allOverview', () => {
  test('counts distinct sessions with events in the rolling 24-hour window', async () => {
    const application = await prisma.application.create({
      data: { workspaceId, name: 'Active Application' },
    });
    const otherApplication = await prisma.application.create({
      data: { workspaceId, name: 'Other Active Application' },
    });

    await addSession(application.id, [
      new Date('2026-11-07T13:00:00Z'),
      new Date('2026-11-08T11:00:00Z'),
      now,
    ]);
    await addSession(application.id, [startAt]);
    await addSession(application.id, [now]);
    await addSession(application.id, [new Date(startAt.getTime() - 1)]);
    await addSession(application.id, [new Date(now.getTime() + 1)]);
    await addSession(application.id, []);
    await addSession(otherApplication.id, [now]);

    expect(await caller.allOverview({ workspaceId })).toEqual({
      [application.id]: 3,
      [otherApplication.id]: 1,
    });
  });

  test('excludes other workspaces and deleted applications', async () => {
    const foreignWorkspace = await prisma.workspace.create({
      data: { name: 'Foreign Application Overview Test' },
    });
    workspaceIds.push(foreignWorkspace.id);
    const foreignApplication = await prisma.application.create({
      data: { workspaceId: foreignWorkspace.id, name: 'Foreign Application' },
    });
    const deletedApplication = await prisma.application.create({
      data: { workspaceId, name: 'Deleted Application', deletedAt: now },
    });
    await addSession(foreignApplication.id, [now]);
    await addSession(deletedApplication.id, [now]);

    expect(await caller.allOverview({ workspaceId })).toEqual({});
  });

  test('returns an empty overview when applications have no recent events', async () => {
    expect(await caller.allOverview({ workspaceId })).toEqual({});

    const application = await prisma.application.create({
      data: { workspaceId, name: 'Inactive Application' },
    });
    await addSession(application.id, [new Date(startAt.getTime() - 1)]);

    expect(await caller.allOverview({ workspaceId })).toEqual({});
  });

  test('rejects users who do not belong to the workspace', async () => {
    mocks.getWorkspaceUser.mockResolvedValueOnce(null);

    await expect(caller.allOverview({ workspaceId })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

test('groups OS versions by both system and version, including legacy sessions', async () => {
  const application = await prisma.application.create({
    data: { workspaceId, name: 'OS Versions' },
  });
  await prisma.applicationSession.createMany({
    data: [
      { os: 'Android', osVersion: '14' },
      { os: 'Android', osVersion: '14' },
      { os: 'iOS', osVersion: '14' },
      { os: 'Android', osVersion: null },
    ].map((device) => ({
      ...device,
      id: randomUUID(),
      applicationId: application.id,
      updatedAt: now,
    })),
  });

  const result = await caller.sessionStats({
    workspaceId,
    applicationId: application.id,
    startAt: startAt.getTime(),
    endAt: now.getTime(),
    groupBy: 'osVersion',
  });
  expect(result).toHaveLength(3);
  expect(result[0]).toEqual({ name: 'Android 14', count: 2 });
  expect(result).toEqual(
    expect.arrayContaining([
      { name: 'iOS 14', count: 1 },
      { name: 'Android (Unknown)', count: 1 },
    ])
  );
});
