import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../../model/_client.js';
import { DATA_TYPE, EVENT_TYPE } from '../../utils/const.js';
import { WebsiteInsightsSqlBuilder } from '../../model/insights/website.js';

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
  const { insightsRouter } = await import('./insights/index.js');
  return insightsRouter.createCaller({
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

vi.mock('../../utils/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/env.js')>();
  return {
    ...actual,
    env: {
      ...actual.env,
      clickhouse: { ...actual.env.clickhouse, enable: true },
    },
  };
});

async function queryDailyUsers(
  caller: Awaited<ReturnType<typeof createCaller>>,
  input: {
    workspaceId: string;
    websiteId: string;
    startAt: number;
    endAt: number;
    timezone: string;
  }
) {
  const { workspaceId, websiteId, ...time } = input;
  const series = await caller.query({
    workspaceId,
    insightId: websiteId,
    insightType: 'website',
    metrics: [
      { name: '$first_visit', math: 'sessions', alias: 'dnu' },
      { name: '$page_view', math: 'sessions', alias: 'dau' },
    ],
    time: { ...time, unit: 'day' },
    filters: [],
    groups: [],
  });
  const dnu = series.find((item) => item.alias === 'dnu')!.data;
  const dau = series.find((item) => item.alias === 'dau')!.data;
  return dnu.map((item, index) => ({
    date: item.date,
    dnu: item.value,
    dau: dau[index].value,
  }));
}

describe('website insight properties', () => {
  const time = {
    startAt: Date.parse('2026-07-02T00:00:00Z'),
    endAt: Date.parse('2026-07-02T23:59:59.999Z'),
    unit: 'day' as const,
    timezone: 'UTC',
  };

  async function setup() {
    const workspace = await prisma.workspace.create({
      data: { name: 'Insight Properties Workspace' },
    });
    workspaceId = workspace.id;
    const website = await prisma.website.create({
      data: { name: 'Properties', domain: 'example.com', workspaceId },
    });
    const session = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        country: 'ES',
        subdivision1: 'MD',
        city: 'Madrid',
        browser: 'chrome',
      },
    });
    const events = [];
    for (const urlPath of ['/', '/pricing']) {
      events.push(
        await prisma.websiteEvent.create({
          data: {
            websiteId: website.id,
            sessionId: session.id,
            urlPath,
            createdAt: new Date('2026-07-02T12:00:00Z'),
          },
        })
      );
    }
    return {
      caller: await createCaller(),
      events,
      input: {
        workspaceId,
        insightId: website.id,
        insightType: 'website' as const,
        metrics: [{ name: '$page_view', math: 'events' as const }],
        time,
      },
    };
  }

  test('returns complete builtin group combinations without losing counts', async () => {
    const { caller, input } = await setup();
    const session = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: input.insightId,
        country: 'ES',
        browser: 'firefox',
      },
    });
    await prisma.websiteEvent.create({
      data: {
        websiteId: input.insightId,
        sessionId: session.id,
        urlPath: '/',
        createdAt: new Date('2026-07-02T12:00:00Z'),
      },
    });
    const result = await caller.query({
      ...input,
      groups: [
        { value: '$country', type: 'string', source: 'builtin' },
        { value: '$browser', type: 'string', source: 'builtin' },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupValues: ['ES', 'chrome'],
          data: [expect.objectContaining({ value: 2 })],
        }),
        expect.objectContaining({
          groupValues: ['ES', 'firefox'],
          data: [expect.objectContaining({ value: 1 })],
        }),
      ])
    );
  });

  test('preserves legacy custom properties with builtin names and groups both sources independently', async () => {
    const { caller, input, events } = await setup();
    await prisma.websiteEventData.create({
      data: {
        websiteId: input.insightId,
        websiteEventId: events[0].id,
        eventKey: '$country',
        dataType: DATA_TYPE.string,
        stringValue: 'MX',
      },
    });
    expect(await caller.filterParams(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '$country', source: 'builtin' }),
        expect.objectContaining({ name: '$country', source: 'custom' }),
      ])
    );
    expect(
      await caller.filterParamValues({ ...input, paramName: '$country' })
    ).toEqual(['MX']);
    expect(
      await caller.filterParamValues({
        ...input,
        paramName: '$country',
        source: 'builtin',
      })
    ).toEqual(['ES']);

    const filter = {
      name: '$country',
      type: 'string' as const,
      operator: 'equals' as const,
      value: 'MX',
    };
    expect(await caller.query({ ...input, filters: [filter] })).toMatchObject([
      { data: [{ value: 1 }] },
    ]);
    expect(
      await caller.queryEvents({ ...input, filters: [filter] })
    ).toMatchObject([{ id: events[0].id }]);
    expect(
      await caller.query({
        ...input,
        filters: [{ ...filter, source: 'builtin', value: 'ES' }],
      })
    ).toMatchObject([{ data: [{ value: 2 }] }]);
    expect(
      await caller.query({
        ...input,
        groups: [
          { value: '$country', type: 'string', source: 'builtin' },
          { value: '$country', type: 'string' },
        ],
      })
    ).toMatchObject([{ groupValues: ['ES', 'MX'], data: [{ value: 1 }] }]);
  });

  test('offers builtin properties and values for page views without custom data', async () => {
    const { caller, input } = await setup();
    const fields = await caller.filterParams(input);
    expect(fields).toEqual(
      expect.arrayContaining([
        { name: '$country', type: 'string', source: 'builtin', count: 0 },
        { name: '$region', type: 'string', source: 'builtin', count: 0 },
        { name: '$browser', type: 'string', source: 'builtin', count: 0 },
        { name: '$url', type: 'string', source: 'builtin', count: 0 },
      ])
    );
    for (const [paramName, values] of [
      ['$country', ['ES']],
      ['$region', ['MD']],
      ['$url', ['/', '/pricing']],
    ] as const) {
      expect(
        (
          await caller.filterParamValues({
            ...input,
            paramName,
            source: 'builtin',
          })
        ).sort()
      ).toEqual([...values].sort());
    }
    expect(
      await caller.filterParamValues({
        ...input,
        paramName: '$os',
        source: 'builtin',
      })
    ).toEqual([]);
    for (const paramName of ['$country', '$url']) {
      expect(
        await caller.filterParamValues({
          ...input,
          workspaceId: createId(),
          paramName,
          source: 'builtin',
        })
      ).toEqual([]);
    }
  });

  test.each([false, true])(
    'filters and groups page views without custom data (ClickHouse fallback: %s)',
    async (fallback) => {
      const { caller, input, events } = await setup();
      if (fallback) {
        mocks.isClickhouseHealthy.mockReturnValue(true);
        mocks.clickhouseQuery.mockRejectedValue(
          new Error('ClickHouse unavailable')
        );
      }
      const filters = [
        {
          name: '$country',
          source: 'builtin' as const,
          type: 'string' as const,
          operator: 'equals' as const,
          value: 'ES',
        },
        {
          name: '$url',
          source: 'builtin' as const,
          type: 'string' as const,
          operator: 'contains' as const,
          value: 'pricing',
        },
      ];
      const result = await caller.query({
        ...input,
        filters,
        groups: [{ value: '$region', type: 'string', source: 'builtin' }],
      });
      expect(result).toMatchObject([{ $region: 'MD', data: [{ value: 1 }] }]);
      const rows = await caller.queryEvents({ ...input, filters });
      expect(rows).toMatchObject([
        {
          id: events[1].id,
          createdAt: events[1].createdAt,
          properties: { urlPath: '/pricing' },
        },
      ]);
      expect(
        await caller.query({
          ...input,
          filters: [{ ...filters[0], value: 'US' }],
        })
      ).toMatchObject([{ data: [] }]);
    }
  );

  test('combines builtin and independent custom properties without changing custom names or multiplying counts', async () => {
    const { caller, input, events } = await setup();
    await prisma.websiteEventData.createMany({
      data: [
        ...['country', 'result', 'plan', 'plan'].map((eventKey) => ({
          websiteId: input.insightId,
          websiteEventId: events[0].id,
          eventKey,
          dataType: DATA_TYPE.string,
          stringValue:
            eventKey === 'country'
              ? 'MX'
              : eventKey === 'result'
                ? 'success'
                : 'pro',
        })),
        ...['country', 'unrelated', 'plan'].map((eventKey) => ({
          websiteId: input.insightId,
          websiteEventId: events[1].id,
          eventKey,
          dataType: DATA_TYPE.string,
          stringValue:
            eventKey === 'country'
              ? 'MX'
              : eventKey === 'unrelated'
                ? 'success'
                : 'basic',
        })),
      ],
    });
    expect(await caller.filterParams(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'country' }),
        expect.objectContaining({ name: '$country' }),
      ])
    );
    expect(
      await caller.filterParamValues({ ...input, paramName: 'country' })
    ).toEqual(['MX']);
    const filters = [
      {
        name: '$country',
        source: 'builtin' as const,
        type: 'string' as const,
        operator: 'equals' as const,
        value: 'ES',
      },
      {
        name: 'country',
        type: 'string' as const,
        operator: 'equals' as const,
        value: 'MX',
      },
      {
        name: 'result',
        type: 'string' as const,
        operator: 'equals' as const,
        value: 'success',
      },
    ];
    expect(
      await caller.query({
        ...input,
        filters,
        groups: [{ value: 'plan', type: 'string' }],
      })
    ).toMatchObject([{ plan: 'pro', data: [{ value: 1 }] }]);
    expect(await caller.queryEvents({ ...input, filters })).toMatchObject([
      { id: events[0].id },
    ]);
    const builder = new WebsiteInsightsSqlBuilder(
      {
        ...input,
        filters,
        groups: [
          {
            value: '$country',
            source: 'builtin',
            type: 'string',
            customGroups: [{ filterOperator: 'equals', filterValue: 'ES' }],
          },
        ],
      },
      { timezone: 'UTC', useClickhouse: false }
    );
    expect(await builder.executeQuery(builder.build())).toMatchObject([
      { '__builtin_group_0|equals|ES': true, $page_view: 1n },
    ]);
  });
});

describe('insightsRouter.query daily website users', () => {
  async function createWebsite(resetAt?: Date) {
    const workspace = await prisma.workspace.create({
      data: { name: 'Daily Stats Workspace' },
    });
    workspaceId = workspace.id;
    return prisma.website.create({
      data: {
        name: 'Daily Stats Website',
        domain: 'daily.example.com',
        workspaceId: workspace.id,
        resetAt,
      },
    });
  }

  async function addVisits(
    websiteId: string,
    visits: { date: string; distinctId?: string; custom?: boolean }[]
  ) {
    const visitorIds = new Map<string, string>();
    // Each event uses a separate fingerprint to exercise identified-user deduplication.
    for (const visit of visits) {
      if (visit.distinctId && !visitorIds.has(visit.distinctId)) {
        visitorIds.set(visit.distinctId, randomUUID());
      }
      const session = await prisma.websiteSession.create({
        data: { id: randomUUID(), websiteId },
      });
      await prisma.websiteEvent.create({
        data: {
          id: createId(),
          websiteId,
          sessionId: session.id,
          distinctId: visit.distinctId
            ? visitorIds.get(visit.distinctId)
            : undefined,
          createdAt: new Date(visit.date),
          urlPath: '/',
          eventType: visit.custom
            ? EVENT_TYPE.customEvent
            : EVENT_TYPE.pageView,
          eventName: visit.custom ? 'signup' : null,
        },
      });
    }
  }

  const range = {
    startAt: Date.parse('2026-07-02T00:00:00Z'),
    endAt: Date.parse('2026-07-04T23:59:59.999Z'),
    timezone: 'UTC',
  };

  test('counts daily unique users and excludes returning users from DNU', async () => {
    const website = await createWebsite();
    await addVisits(website.id, [
      { date: '2026-07-01T10:00:00Z', distinctId: 'returning' },
      { date: '2026-07-02T10:00:00Z', distinctId: 'returning' },
      { date: '2026-07-02T11:00:00Z', distinctId: 'new' },
      { date: '2026-07-02T11:00:00Z', distinctId: 'new' },
      { date: '2026-07-02T11:00:00Z', distinctId: 'new', custom: true },
      { date: '2026-07-02T12:00:00Z', distinctId: 'new' },
      { date: '2026-07-02T13:00:00Z' },
      { date: '2026-07-02T14:00:00Z', distinctId: 'custom', custom: true },
      { date: '2026-07-03T10:00:00Z', distinctId: 'new' },
      { date: '2026-07-05T10:00:00Z', distinctId: 'outside' },
    ]);
    const caller = await createCaller();
    expect(
      await queryDailyUsers(caller, {
        workspaceId: website.workspaceId,
        websiteId: website.id,
        ...range,
      })
    ).toEqual([
      { date: '2026-07-02 00:00:00', dnu: 2, dau: 3 },
      { date: '2026-07-03 00:00:00', dnu: 0, dau: 1 },
      { date: '2026-07-04 00:00:00', dnu: 0, dau: 0 },
    ]);
  });

  test('combines first visits with custom-event metrics without dropping custom-only visitors', async () => {
    const website = await createWebsite();
    await addVisits(website.id, [
      { date: '2026-07-02T11:00:00Z', distinctId: 'new' },
      { date: '2026-07-02T11:00:00Z', distinctId: 'new', custom: true },
      { date: '2026-07-02T11:00:00Z', distinctId: 'custom-only', custom: true },
    ]);
    const caller = await createCaller();
    const result = await caller.query({
      workspaceId: website.workspaceId,
      insightId: website.id,
      insightType: 'website',
      metrics: [
        { name: '$first_visit', math: 'sessions', alias: 'dnu' },
        { name: 'signup', math: 'events', alias: 'signups' },
      ],
      time: { ...range, unit: 'day' },
    });
    expect(result.find((item) => item.alias === 'dnu')?.data[0].value).toBe(1);
    expect(result.find((item) => item.alias === 'signups')?.data[0].value).toBe(
      2
    );
  });

  test('uses local calendar days across a daylight saving transition', async () => {
    const website = await createWebsite();
    await addVisits(website.id, [
      { date: '2026-03-08T04:59:59Z', distinctId: 'night' },
      { date: '2026-03-08T05:00:00Z', distinctId: 'night' },
      { date: '2026-03-08T07:00:00Z', distinctId: 'new' },
      { date: '2026-03-09T03:59:59Z', distinctId: 'new' },
      { date: '2026-03-09T04:00:00Z', distinctId: 'new' },
    ]);
    const caller = await createCaller();
    expect(
      await queryDailyUsers(caller, {
        workspaceId: website.workspaceId,
        websiteId: website.id,
        startAt: Date.parse('2026-03-08T05:00:00Z'),
        endAt: Date.parse('2026-03-09T23:59:59Z'),
        timezone: 'America/New_York',
      })
    ).toEqual([
      { date: '2026-03-08 00:00:00', dnu: 1, dau: 2 },
      { date: '2026-03-09 00:00:00', dnu: 0, dau: 1 },
    ]);
  });

  test('counts first visits after a website reset and falls back when ClickHouse fails', async () => {
    const website = await createWebsite(new Date('2026-07-02T00:00:00Z'));
    await addVisits(website.id, [
      { date: '2026-07-01T10:00:00Z', distinctId: 'visitor' },
      { date: '2026-07-02T10:00:00Z', distinctId: 'visitor' },
      { date: '2026-07-03T10:00:00Z', distinctId: 'visitor' },
    ]);
    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockRejectedValue(
      new Error('ClickHouse unavailable')
    );
    const caller = await createCaller();
    expect(
      await queryDailyUsers(caller, {
        workspaceId: website.workspaceId,
        websiteId: website.id,
        ...range,
        startAt: Date.parse('2026-07-01T00:00:00Z'),
      })
    ).toEqual([
      { date: '2026-07-01 00:00:00', dnu: 0, dau: 0 },
      { date: '2026-07-02 00:00:00', dnu: 1, dau: 1 },
      { date: '2026-07-03 00:00:00', dnu: 0, dau: 1 },
      { date: '2026-07-04 00:00:00', dnu: 0, dau: 0 },
    ]);
    expect(mocks.forceClickhouseHealthCheck).toHaveBeenCalledOnce();
  });

  test('normalizes ClickHouse counts and restricts access to the website workspace', async () => {
    const website = await createWebsite();
    mocks.isClickhouseHealthy.mockReturnValue(true);
    mocks.clickhouseQuery.mockResolvedValue({
      json: async () => ({
        data: [{ date: '2026-07-02 00:00:00', dnu: '2', dau: '5' }],
      }),
    });
    const caller = await createCaller();
    expect(
      await queryDailyUsers(caller, {
        workspaceId: website.workspaceId,
        websiteId: website.id,
        ...range,
      })
    ).toEqual([
      { date: '2026-07-02 00:00:00', dnu: 2, dau: 5 },
      { date: '2026-07-03 00:00:00', dnu: 0, dau: 0 },
      { date: '2026-07-04 00:00:00', dnu: 0, dau: 0 },
    ]);
    await expect(
      queryDailyUsers(caller, {
        workspaceId: createId(),
        websiteId: website.id,
        ...range,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(mocks.clickhouseQuery).toHaveBeenCalledOnce();
  });
});
