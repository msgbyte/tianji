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
