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

async function addSession(
  applicationId: string,
  eventDates: Date[],
  eventType = 1
) {
  await prisma.applicationSession.create({
    data: {
      id: randomUUID(),
      applicationId,
      createdAt: new Date('2026-11-01T00:00:00Z'),
      applicationEvent: {
        create: eventDates.map((createdAt) => ({
          applicationId,
          createdAt,
          eventType,
        })),
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

describe('applicationRouter.retention', () => {
  const range = {
    startAt: Date.parse('2026-07-01T00:00:00Z'),
    endAt: Date.parse('2026-07-02T23:59:59.999Z'),
    timezone: 'UTC',
  };

  test('counts first-event cohorts and distinct returners through D30 beyond the cohort range', async () => {
    const application = await prisma.application.create({
      data: { workspaceId, name: 'Retention Application' },
    });
    const otherApplication = await prisma.application.create({
      data: { workspaceId, name: 'Other Retention Application' },
    });
    await addSession(application.id, [
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-01T12:00:00Z'),
      new Date('2026-07-02T10:00:00Z'),
      new Date('2026-07-02T20:00:00Z'),
      new Date('2026-07-31T23:59:59Z'),
      new Date('2026-08-01T00:00:00Z'),
    ]);
    await addSession(application.id, [new Date('2026-07-01T11:00:00Z')]);
    await addSession(
      application.id,
      [
        new Date('2026-07-02T23:59:59.999Z'),
        new Date('2026-07-03T12:00:00Z'),
        new Date('2026-08-01T23:59:59Z'),
      ],
      2
    );
    // A returning visitor must not become a new cohort in the selected range.
    await addSession(
      application.id,
      [new Date('2026-06-30T23:59:59.999Z'), new Date('2026-07-01T12:00:00Z')],
      2
    );
    await addSession(application.id, [new Date('2026-07-03T00:00:00Z')]);
    await addSession(application.id, []);
    await addSession(otherApplication.id, [new Date('2026-07-01T12:00:00Z')]);

    expect(
      await caller.retention({
        workspaceId,
        applicationId: application.id,
        ...range,
      })
    ).toEqual([
      {
        date: '2026-07-02',
        cohortSize: 1,
        retention: [1, 1, ...Array(28).fill(0), 1],
      },
      {
        date: '2026-07-01',
        cohortSize: 2,
        retention: [2, 1, ...Array(28).fill(0), 1],
      },
    ]);
  });

  test('uses the requested timezone for cohort and return days', async () => {
    const application = await prisma.application.create({
      data: { workspaceId, name: 'Timezone Retention Application' },
    });
    await addSession(application.id, [
      new Date('2026-07-01T23:30:00Z'),
      new Date('2026-07-02T00:30:00Z'),
      new Date('2026-07-02T23:30:00Z'),
    ]);

    const [cohort] = await caller.retention({
      workspaceId,
      applicationId: application.id,
      ...range,
      timezone: 'America/Los_Angeles',
    });
    expect(cohort).toEqual({
      date: '2026-07-01',
      cohortSize: 1,
      retention: [1, 1, ...Array(29).fill(0)],
    });

    const [easternCohort] = await caller.retention({
      workspaceId,
      applicationId: application.id,
      ...range,
      timezone: 'Asia/Tokyo',
    });
    expect(easternCohort.date).toBe('2026-07-02');
    expect(easternCohort.retention).toEqual(cohort.retention);
  });

  test('leaves incomplete return days null instead of reporting zero', async () => {
    const application = await prisma.application.create({
      data: { workspaceId, name: 'Recent Retention Application' },
    });
    // PostgreSQL determines day completeness using its own clock.
    const [{ today }] = await prisma.$queryRaw<{ today: Date }[]>`
      select date_trunc('day', current_timestamp at time zone 'UTC') at time zone 'UTC' as today
    `;
    const day = 24 * 60 * 60 * 1000;
    const yesterday = new Date(today.getTime() - day);
    const twoDaysAgo = new Date(today.getTime() - 2 * day);
    await addSession(application.id, [twoDaysAgo, yesterday, today]);
    await addSession(application.id, [yesterday, today]);

    const cohorts = await caller.retention({
      workspaceId,
      applicationId: application.id,
      startAt: twoDaysAgo.getTime(),
      endAt: today.getTime() - 1,
      timezone: 'UTC',
    });
    expect(cohorts).toEqual([
      {
        date: yesterday.toISOString().slice(0, 10),
        cohortSize: 1,
        retention: [1, ...Array(30).fill(null)],
      },
      {
        date: twoDaysAgo.toISOString().slice(0, 10),
        cohortSize: 1,
        retention: [1, 1, ...Array(29).fill(null)],
      },
    ]);
  });

  test('returns an empty list when no new visitors arrive in the range', async () => {
    const application = await prisma.application.create({
      data: { workspaceId, name: 'Empty Retention Application' },
    });
    expect(
      await caller.retention({
        workspaceId,
        applicationId: application.id,
        ...range,
      })
    ).toEqual([]);
  });

  test('rejects missing, deleted and foreign applications and non-members', async () => {
    const foreignWorkspace = await prisma.workspace.create({
      data: { name: 'Foreign Retention Workspace' },
    });
    workspaceIds.push(foreignWorkspace.id);
    const foreignApplication = await prisma.application.create({
      data: { workspaceId: foreignWorkspace.id, name: 'Foreign Application' },
    });
    const deletedApplication = await prisma.application.create({
      data: { workspaceId, name: 'Deleted Application', deletedAt: now },
    });

    for (const applicationId of [
      'missing-application',
      foreignApplication.id,
      deletedApplication.id,
    ]) {
      await expect(
        caller.retention({ workspaceId, applicationId, ...range })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }

    mocks.getWorkspaceUser.mockResolvedValueOnce(null);
    await expect(
      caller.retention({
        workspaceId,
        applicationId: foreignApplication.id,
        ...range,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
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
