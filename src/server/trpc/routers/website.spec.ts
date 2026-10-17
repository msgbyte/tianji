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

describe('website event filters', () => {
  let websiteId: string;
  const range = {
    startAt: new Date('2026-07-01T00:00:00Z').valueOf(),
    endAt: new Date('2026-07-02T23:59:59.999Z').valueOf(),
    timezone: 'UTC',
    unit: 'day',
  };

  beforeEach(async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Website Event Filter Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        workspaceId,
        name: 'Website Event Filter Test',
        domain: 'events.example.com',
      },
    });
    websiteId = website.id;
    const sessionIds = [randomUUID(), randomUUID()];
    await prisma.websiteSession.createMany({
      data: sessionIds.map((id, index) => ({
        id,
        websiteId,
        browser: index === 0 ? 'Firefox' : 'Chrome',
        language: index === 0 ? 'es-ES' : 'en-US',
      })),
    });
    await prisma.websiteEvent.createMany({
      data: [
        ...[0, 1, 2, 3].map((index) => ({
          websiteId,
          sessionId: sessionIds[0],
          urlPath: '/',
          eventType: EVENT_TYPE.pageView,
          createdAt: new Date(`2026-07-01T08:0${index}:00Z`),
        })),
        ...[
          ['2026-07-01T12:00:00Z', 'signup', sessionIds[0]],
          ['2026-07-01T12:10:00Z', 'signup', sessionIds[0]],
          ['2026-07-02T12:00:00Z', 'signup', sessionIds[1]],
          ['2026-07-01T12:15:00Z', 'purchase', sessionIds[0]],
          ['2026-06-30T12:00:00Z', 'signup', sessionIds[0]],
          ['2026-07-03T12:00:00Z', 'signup', sessionIds[0]],
        ].map(([createdAt, eventName, sessionId]) => ({
          websiteId,
          sessionId,
          urlPath: '/checkout',
          eventType: EVENT_TYPE.customEvent,
          eventName,
          utmSource: 'newsletter',
          createdAt: new Date(createdAt),
        })),
      ],
    });
  });

  test('counts matching custom events and visitors in both comparison periods', async () => {
    const caller = await createCaller();
    const result = await caller.stats({
      workspaceId: workspaceId!,
      websiteId,
      ...range,
      event: 'signup',
    });

    expect(result).toEqual({
      pageviews: { value: 3, prev: 1 },
      uniques: { value: 2, prev: 1 },
      bounces: { value: 1, prev: 1 },
      totaltime: { value: 600, prev: 0 },
    });
  });

  test('returns event and visitor trends while applying language and UTM filters', async () => {
    const caller = await createCaller();
    const input = {
      workspaceId: workspaceId!,
      websiteId,
      ...range,
      event: 'signup',
    };

    const trends = await caller.pageviews(input);
    expect(
      [...trends.pageviews].sort((a, b) => a.x.localeCompare(b.x))
    ).toEqual([
      { x: '2026-07-01', y: BigInt(2) },
      { x: '2026-07-02', y: BigInt(1) },
    ]);
    expect([...trends.sessions].sort((a, b) => a.x.localeCompare(b.x))).toEqual(
      [
        { x: '2026-07-01', y: BigInt(1) },
        { x: '2026-07-02', y: BigInt(1) },
      ]
    );
    expect(
      await caller.pageviews({
        ...input,
        language: 'es-ES',
        utm_source: 'newsletter',
      })
    ).toEqual({
      pageviews: [{ x: '2026-07-01', y: BigInt(2) }],
      sessions: [{ x: '2026-07-01', y: BigInt(1) }],
    });
    expect(await caller.pageviews({ ...input, utm_source: 'other' })).toEqual({
      pageviews: [],
      sessions: [],
    });
  });

  test('uses matching custom events for page and visitor dimension metrics', async () => {
    const caller = await createCaller();
    const input = {
      workspaceId: workspaceId!,
      websiteId,
      ...range,
      event: 'signup',
    };

    expect(await caller.metrics({ ...input, type: 'url' })).toEqual([
      { x: '/checkout', y: 3 },
    ]);
    expect(
      await caller.metrics({ ...input, type: 'browser', language: 'es-ES' })
    ).toEqual([{ x: 'Firefox', y: 1 }]);
    expect(await caller.metrics({ ...input, type: 'event' })).toEqual([
      { x: 'signup', y: 3 },
    ]);
  });

  test('keeps page-view defaults and the unfiltered custom-event ranking', async () => {
    const caller = await createCaller();
    const input = { workspaceId: workspaceId!, websiteId, ...range };

    expect((await caller.stats(input)).pageviews).toEqual({
      value: 4,
      prev: 0,
    });
    expect(await caller.pageviews(input)).toEqual({
      pageviews: [{ x: '2026-07-01', y: BigInt(4) }],
      sessions: [{ x: '2026-07-01', y: BigInt(1) }],
    });
    expect(await caller.metrics({ ...input, type: 'url' })).toEqual([
      { x: '/', y: 4 },
    ]);
    expect(await caller.metrics({ ...input, type: 'browser' })).toEqual([
      { x: 'Firefox', y: 1 },
    ]);
    expect(await caller.metrics({ ...input, type: 'event' })).toEqual([
      { x: 'signup', y: 3 },
      { x: 'purchase', y: 1 },
    ]);
  });

  test('passes the custom event type and bound name to ClickHouse stats and metrics', async () => {
    const caller = await createCaller();
    const { env } = await import('../../utils/env.js');
    env.clickhouse.enable = true;
    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockResolvedValue({
      json: async () => ({ data: [] }),
    });
    const input = {
      workspaceId: workspaceId!,
      websiteId,
      ...range,
      event: "sign'up",
    };

    await caller.stats(input);
    await caller.metrics({ ...input, type: 'url' });
    await caller.metrics({ ...input, type: 'browser' });

    expect(mocks.clickhouseQuery).toHaveBeenCalledTimes(4);
    for (const [query] of mocks.clickhouseQuery.mock.calls) {
      expect(query.query_params).toMatchObject({
        eventType: 2,
        filter_0: "sign'up",
      });
      expect(query.query).toContain('eventType = {eventType:UInt64}');
      expect(query.query).toContain('eventName = {filter_0:String}');
      expect(query.query).not.toContain("sign'up");
    }
  });

  test('retains the event filter when ClickHouse falls back to PostgreSQL', async () => {
    const caller = await createCaller();
    const { env } = await import('../../utils/env.js');
    env.clickhouse.enable = true;
    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockRejectedValue(
      new Error('ClickHouse unavailable')
    );
    const input = {
      workspaceId: workspaceId!,
      websiteId,
      ...range,
      event: 'signup',
    };

    expect((await caller.stats(input)).pageviews).toEqual({
      value: 3,
      prev: 1,
    });
    expect(await caller.metrics({ ...input, type: 'url' })).toEqual([
      { x: '/checkout', y: 3 },
    ]);
    expect(
      await caller.metrics({ ...input, type: 'browser', language: 'es-ES' })
    ).toEqual([{ x: 'Firefox', y: 1 }]);
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

  test('prefers ClickHouse and returns D0-D30 retention', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'ClickHouse Retention Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'ClickHouse Retention Website',
        domain: 'clickhouse-retention.example.com',
        workspaceId: workspace.id,
      },
    });
    const counts = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [`d${index + 1}`, '0'])
    );
    counts.d1 = '1';
    counts.d30 = '1';

    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockResolvedValue({
      json: async () => ({
        data: [
          {
            date: '2026-07-01',
            cohortSize: '2',
            ...counts,
          },
        ],
      }),
    });

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
      endAt: new Date('2026-07-02T00:00:00.000Z').valueOf(),
      timezone: 'UTC',
    });

    expect(result).toEqual([
      {
        date: '2026-07-01',
        cohortSize: 2,
        retention: [2, 1, ...Array(28).fill(0), 1],
      },
    ]);
    expect(mocks.clickhouseQuery).toHaveBeenCalledOnce();
    const query = mocks.clickhouseQuery.mock.calls[0]?.[0];
    expect(query.query).toContain('{eventType:UInt8}');
    expect(query.query).toContain('toDateTime64');
    expect(query.query).toContain('d30');
    expect(query.query_params).toMatchObject({
      websiteId: website.id,
      eventType: EVENT_TYPE.pageView,
      timezone: 'UTC',
    });
  });

  test('falls back to PostgreSQL when the ClickHouse retention query fails', async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Retention Fallback Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: {
        name: 'Retention Fallback Website',
        domain: 'retention-fallback.example.com',
        workspaceId: workspace.id,
      },
    });
    const sessionId = randomUUID();
    const cohortAt = new Date('2026-07-01T08:00:00.000Z');

    await prisma.websiteSession.create({
      data: { id: sessionId, websiteId: website.id },
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
    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockRejectedValue(new Error('ClickHouse unavailable'));

    const caller = await createCaller();
    const result = await caller.retention({
      workspaceId: workspace.id,
      websiteId: website.id,
      startAt: new Date('2026-07-01T00:00:00.000Z').valueOf(),
      endAt: new Date('2026-07-02T00:00:00.000Z').valueOf(),
      timezone: 'UTC',
    });

    expect(result[0]).toMatchObject({
      date: '2026-07-01',
      cohortSize: 1,
    });
    expect(result[0]?.retention).toHaveLength(31);
    expect(mocks.forceClickhouseHealthCheck).toHaveBeenCalledOnce();
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
    });
    expect(result[0]?.retention[1]).toBeNull();
  });

  test('includes the full local day across DST in the D30 activity window', async () => {
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
    const day30At = new Date('2025-11-25T04:30:00.000Z');
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
      data: [cohortAt, day30At].map((createdAt, index) => ({
        id: createId(),
        websiteId: website.id,
        sessionId,
        urlPath: index === 0 ? '/' : '/day-thirty',
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
    expect(result[0]?.retention[30]).toBe(1);
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

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: '2026-07-02',
      cohortSize: 1,
    });
    expect(result[0]?.retention).toHaveLength(31);
    expect(result[0]?.retention[0]).toBe(1);
    expect(result[0]?.retention[1]).toBe(1);
    expect(result[0]?.retention[2]).toBe(0);
    expect(result[0]?.retention[30]).toBe(0);
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

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: '2026-07-03',
      cohortSize: 1,
    });
    expect(result[0]?.retention[1]).toBe(1);
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

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: now.toISOString().slice(0, 10),
      cohortSize: 1,
    });
    expect(result[0]?.retention.slice(1)).toEqual(Array(30).fill(null));
    expect(result[1]).toMatchObject({ date: '2026-07-01', cohortSize: 2 });
    expect(result[1]?.retention[0]).toBe(2);
    expect(result[1]?.retention[1]).toBe(1);
    expect(result[1]?.retention[7]).toBe(1);
    expect(result[1]?.retention[30]).toBe(0);
  });
});
