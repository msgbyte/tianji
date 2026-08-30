import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../../model/_client.js';
import { EVENT_TYPE } from '../../utils/const.js';

const mocks = vi.hoisted(() => {
  const endRequest = vi.fn();

  return {
    clickhouseQuery: vi.fn(),
    endRequest,
    forceClickhouseHealthCheck: vi.fn(async () => false),
    isClickhouseHealthy: vi.fn(() => false),
    jwtVerify: vi.fn(() => ({
      id: 'user-id',
      username: 'user',
      role: 'user',
    })),
    getWorkspaceUser: vi.fn(async () => ({ role: 'owner' })),
    promStartTimer: vi.fn(() => endRequest),
  };
});

vi.mock('../../middleware/auth.js', () => ({ jwtVerify: mocks.jwtVerify }));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: mocks.promStartTimer },
}));
vi.mock('../../mq/producer.js', () => ({
  sendBuildLighthouseMessageQueue: vi.fn(),
}));
vi.mock('../../clickhouse/index.js', () => ({
  clickhouse: {
    query: mocks.clickhouseQuery,
  },
}));
vi.mock('../../clickhouse/health.js', () => ({
  clickhouseHealthManager: {
    forceHealthCheck: mocks.forceClickhouseHealthCheck,
    isClickHouseHealthy: mocks.isClickhouseHealthy,
  },
}));

async function createCaller() {
  const { websiteRouter } = await import('./website.js');
  return websiteRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

let workspaceId: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isClickhouseHealthy.mockReturnValue(false);
});
afterEach(async () => {
  if (workspaceId) {
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
    workspaceId = undefined;
  }

  vi.resetModules();
});

describe('websiteRouter.allOverview', () => {
  test('prefers ClickHouse visitor counts when ClickHouse is healthy', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'ClickHouse Overview Workspace',
      },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'ClickHouse Overview Website',
        domain: 'clickhouse.example.com',
        workspaceId: workspace.id,
      },
    });

    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockResolvedValue({
      json: async () => ({
        data: [{ websiteId: website.id, visitorCount: '7' }],
      }),
    });

    const caller = await createCaller();
    const result = await caller.allOverview({ workspaceId: workspace.id });

    expect(result).toEqual({ [website.id]: 7 });
  });

  test('falls back to PostgreSQL when the ClickHouse query fails', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'ClickHouse Fallback Workspace',
      },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'ClickHouse Fallback Website',
        domain: 'fallback.example.com',
        workspaceId: workspace.id,
      },
    });
    const session = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        hostname: 'fallback.example.com',
      },
    });
    await prisma.websiteEvent.create({
      data: {
        id: createId(),
        websiteId: website.id,
        sessionId: session.id,
        urlPath: '/recent-page',
        eventType: EVENT_TYPE.pageView,
        eventName: null,
      },
    });

    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockRejectedValue(
      new Error('ClickHouse unavailable')
    );

    const caller = await createCaller();
    const result = await caller.allOverview({ workspaceId: workspace.id });

    expect(result).toEqual({ [website.id]: 1 });
  });

  test('counts unique page-view visitors from the previous 24 hours', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'PV Test Workspace',
      },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'PV Test Website',
        domain: 'example.com',
        workspaceId: workspace.id,
      },
    });
    const session = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        hostname: 'example.com',
      },
    });
    const secondSessionId = randomUUID();
    const customEventSessionId = randomUUID();
    const oldSessionId = randomUUID();
    await prisma.websiteSession.createMany({
      data: [secondSessionId, customEventSessionId, oldSessionId].map((id) => ({
        id,
        websiteId: website.id,
        hostname: 'example.com',
      })),
    });
    const now = Date.now();

    await prisma.websiteEvent.createMany({
      data: [
        {
          id: createId(),
          websiteId: website.id,
          sessionId: session.id,
          urlPath: '/recent-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: session.id,
          urlPath: '/another-recent-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 30 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: secondSessionId,
          urlPath: '/second-visitor-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: customEventSessionId,
          urlPath: '/recent-custom',
          eventType: EVENT_TYPE.customEvent,
          eventName: 'click',
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: customEventSessionId,
          urlPath: '/recent-unnamed-custom',
          eventType: EVENT_TYPE.customEvent,
          eventName: null,
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: oldSessionId,
          urlPath: '/old-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 25 * 60 * 60 * 1000),
        },
      ],
    });

    const caller = await createCaller();
    const result = await caller.allOverview({ workspaceId: workspace.id });

    expect(result).toEqual({ [website.id]: 2 });
  });
});

describe('websiteRouter.retention', () => {
  test('rejects a website outside the authorized workspace', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Authorized Workspace' },
    });
    workspaceId = workspace.id;
    const otherWorkspace = await prisma.workspace.create({
      data: { name: 'Retention Other Workspace' },
    });

    try {
      const website = await prisma.website.create({
        data: {
          name: 'Retention Other Website',
          domain: 'retention-other.example.com',
          workspaceId: otherWorkspace.id,
        },
      });
      const caller = await createCaller();

      await expect(
        caller.retention({
          workspaceId: workspace.id,
          websiteId: website.id,
          startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
          endAt: new Date('2026-07-02T00:00:00.000Z').valueOf(),
          timezone: 'UTC',
        })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    } finally {
      await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
    }
  });

  test('keeps retention null until the target day is complete', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Maturity Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention Maturity Website',
        domain: 'retention-maturity.example.com',
        workspaceId: workspace.id,
      },
    });
    const now = new Date();
    const cohortStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1
      )
    );
    const cohortAt = new Date(cohortStart.valueOf() + 12 * 60 * 60 * 1000);
    const sessionId = randomUUID();

    await prisma.websiteSession.create({
      data: {
        id: sessionId,
        websiteId: website.id,
        hostname: website.domain,
        createdAt: cohortAt,
      },
    });
    await prisma.websiteEvent.create({
      data: {
        id: createId(),
        websiteId: website.id,
        sessionId,
        urlPath: '/',
        eventType: EVENT_TYPE.pageView,
        createdAt: cohortAt,
      },
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: cohortStart.valueOf(),
      endAt: now.valueOf(),
      timezone: 'UTC',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: cohortStart.toISOString().slice(0, 10),
      d1: null,
    });
  });

  test('includes the full local day across DST in the D14 activity window', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Window Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention Window Website',
        domain: 'retention-window.example.com',
        workspaceId: workspace.id,
      },
    });
    const cohortStart = new Date('2025-10-25T04:00:00.000Z');
    const cohortAt = new Date('2025-10-25T12:00:00.000Z');
    const queryEnd = new Date('2025-10-26T03:59:00.000Z');
    const day14At = new Date('2025-11-09T04:30:00.000Z');
    const sessionId = randomUUID();

    await prisma.websiteSession.create({
      data: {
        id: sessionId,
        websiteId: website.id,
        hostname: website.domain,
        createdAt: cohortAt,
      },
    });
    await prisma.websiteEvent.createMany({
      data: [cohortAt, day14At].map((createdAt, index) => ({
        id: createId(),
        websiteId: website.id,
        sessionId,
        urlPath: index === 0 ? '/' : '/day-fourteen',
        eventType: EVENT_TYPE.pageView,
        createdAt,
      })),
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: cohortStart.valueOf(),
      endAt: queryEnd.valueOf(),
      timezone: 'America/New_York',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.d14).toBe(1);
  });

  test('uses the first page view date as the cohort date', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention First Page View Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention First Page View Website',
        domain: 'retention-first-page-view.example.com',
        workspaceId: workspace.id,
      },
    });
    const sessionId = randomUUID();

    await prisma.websiteSession.create({
      data: {
        id: sessionId,
        websiteId: website.id,
        hostname: website.domain,
        createdAt: new Date('2026-07-01T08:00:00.000Z'),
      },
    });
    await prisma.websiteEvent.createMany({
      data: [
        {
          id: createId(),
          websiteId: website.id,
          sessionId,
          urlPath: '/',
          eventType: EVENT_TYPE.customEvent,
          eventName: 'signup',
          createdAt: new Date('2026-07-01T08:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId,
          urlPath: '/first-page-view',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-02T08:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId,
          urlPath: '/day-one',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-03T08:00:00.000Z'),
        },
      ],
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
      endAt: new Date('2026-07-04T00:00:00.000Z').valueOf(),
      timezone: 'UTC',
    });

    expect(result).toEqual([
      {
        date: '2026-07-02',
        cohortSize: 1,
        d1: 1,
        d3: 0,
        d5: 0,
        d7: 0,
        d14: 0,
      },
    ]);
  });

  test('starts visitor cohorts after the website reset date', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Reset Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention Reset Website',
        domain: 'retention-reset.example.com',
        workspaceId: workspace.id,
        resetAt: new Date('2026-07-02T00:00:00.000Z'),
      },
    });
    const sessionId = randomUUID();

    await prisma.websiteSession.create({
      data: { id: sessionId, websiteId: website.id },
    });
    await prisma.websiteEvent.createMany({
      data: [
        ['2026-07-01T08:00:00.000Z', '/before-reset'],
        ['2026-07-03T08:00:00.000Z', '/after-reset'],
        ['2026-07-04T08:00:00.000Z', '/day-one'],
      ].map(([createdAt, urlPath]) => ({
        id: createId(),
        websiteId: website.id,
        sessionId,
        urlPath,
        eventType: EVENT_TYPE.pageView,
        createdAt: new Date(createdAt),
      })),
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
      endAt: new Date('2026-07-05T00:00:00.000Z').valueOf(),
      timezone: 'UTC',
    });

    expect(result).toEqual([
      {
        date: '2026-07-03',
        cohortSize: 1,
        d1: 1,
        d3: 0,
        d5: 0,
        d7: 0,
        d14: 0,
      },
    ]);
  });

  test('returns page-view cohorts, repeat visits, and immature periods', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Test Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention Test Website',
        domain: 'retention.example.com',
        workspaceId: workspace.id,
      },
    });
    const returnedSessionId = randomUUID();
    const newSessionId = randomUUID();
    const customOnlySessionId = randomUUID();
    const currentSessionId = randomUUID();
    const now = new Date();

    await prisma.websiteSession.createMany({
      data: [
        {
          id: returnedSessionId,
          websiteId: website.id,
          hostname: website.domain,
          createdAt: new Date('2026-07-01T08:00:00.000Z'),
        },
        {
          id: newSessionId,
          websiteId: website.id,
          hostname: website.domain,
          createdAt: new Date('2026-07-01T09:00:00.000Z'),
        },
        {
          id: customOnlySessionId,
          websiteId: website.id,
          hostname: website.domain,
          createdAt: new Date('2026-07-01T10:00:00.000Z'),
        },
        {
          id: currentSessionId,
          websiteId: website.id,
          hostname: website.domain,
          createdAt: now,
        },
      ],
    });
    await prisma.websiteEvent.createMany({
      data: [
        {
          id: createId(),
          websiteId: website.id,
          sessionId: returnedSessionId,
          urlPath: '/',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-01T08:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: newSessionId,
          urlPath: '/',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-01T09:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: returnedSessionId,
          urlPath: '/day-one',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-02T08:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: returnedSessionId,
          urlPath: '/day-seven',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date('2026-07-08T08:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: customOnlySessionId,
          urlPath: '/',
          eventType: EVENT_TYPE.customEvent,
          eventName: 'signup',
          createdAt: new Date('2026-07-01T10:00:00.000Z'),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: currentSessionId,
          urlPath: '/',
          eventType: EVENT_TYPE.pageView,
          createdAt: now,
        },
      ],
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
      endAt: now.valueOf(),
      timezone: 'UTC',
    });

    expect(result).toEqual([
      {
        date: now.toISOString().slice(0, 10),
        cohortSize: 1,
        d1: null,
        d3: null,
        d5: null,
        d7: null,
        d14: null,
      },
      {
        date: '2026-07-01',
        cohortSize: 2,
        d1: 1,
        d3: 0,
        d5: 0,
        d7: 1,
        d14: 0,
      },
    ]);
  });
});
