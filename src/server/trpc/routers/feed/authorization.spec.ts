import { createId } from '@paralleldrive/cuid2';
import { FeedStateStatus } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const endRequest = vi.fn();

  return {
    jwtVerify: vi.fn(() => ({
      id: 'user-id',
      username: 'user',
      role: 'user',
    })),
    getWorkspaceUser: vi.fn(async () => ({ role: 'owner' })),
    promStartTimer: vi.fn(() => endRequest),
    fetchDataByCursor: vi.fn(),
    feedStateResolve: vi.fn(),
    prisma: {
      workspaceAuditLog: {
        create: vi.fn(),
      },
      feedChannel: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      feedEvent: {
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      feedState: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../middleware/auth.js', () => ({
  jwtVerify: mocks.jwtVerify,
}));

vi.mock('../../../model/auth.js', () => ({
  authConfig: {},
}));

vi.mock('../../../model/user.js', () => ({
  verifyUserApiKey: vi.fn(),
}));

vi.mock('../../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));

vi.mock('../../../utils/prometheus/client.js', () => ({
  promTrpcRequest: {
    startTimer: mocks.promStartTimer,
  },
}));

vi.mock('../../../model/_client.js', () => ({
  prisma: mocks.prisma,
}));

vi.mock('../../../utils/prisma.js', () => ({
  fetchDataByCursor: mocks.fetchDataByCursor,
}));

vi.mock('../../../model/feed/shared.js', () => ({
  delFeedEventNotifyCache: vi.fn(),
}));

vi.mock('../../../model/billing/limit.js', () => ({
  getWorkspaceTierLimit: vi.fn(),
}));

vi.mock('../../../model/billing/workspace.js', () => ({
  isWorkspacePaused: vi.fn(async () => false),
}));

vi.mock('../../../model/feed/state.js', () => ({
  feedStateResolve: mocks.feedStateResolve,
  feedStateUpsert: vi.fn(),
}));

function channel(overrides: Partial<any> = {}) {
  return {
    id: 'channel-id',
    workspaceId: createId(),
    name: 'Alerts',
    webhookSignature: '',
    notifyFrequency: 'day',
    publicShareId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function event(overrides: Partial<any> = {}) {
  return {
    id: 'event-id',
    channelId: 'channel-id',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    eventName: 'alert',
    eventContent: 'victim data',
    tags: [],
    source: 'test',
    senderId: null,
    senderName: null,
    url: null,
    important: false,
    archived: false,
    payload: null,
    ...overrides,
  };
}

function state(overrides: Partial<any> = {}) {
  return {
    id: 'state-id',
    channelId: 'channel-id',
    eventId: 'external-event-id',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    eventName: 'alert',
    eventContent: 'victim data',
    tags: [],
    source: 'test',
    senderId: null,
    senderName: null,
    url: null,
    important: false,
    payload: null,
    status: FeedStateStatus.Ongoing,
    resolvedAt: null,
    ...overrides,
  };
}

function mockVictimChannel(victimChannel: ReturnType<typeof channel>) {
  mocks.prisma.feedChannel.findFirst.mockImplementation(
    async ({ where }: any) =>
      where.id === victimChannel.id &&
      (where.workspaceId === undefined ||
        where.workspaceId === victimChannel.workspaceId)
        ? victimChannel
        : null
  );
}

async function createCaller() {
  const { feedRouter } = await import('./index.js');

  return feedRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: { headers: {} } as any,
    origin: '',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetModules();
});

describe('feed channel authorization', () => {
  test('rejects fetching events from another workspace channel', async () => {
    const attackerWorkspaceId = createId();
    const victimChannel = channel({ workspaceId: createId() });
    const victimEvent = event({ channelId: victimChannel.id });
    mockVictimChannel(victimChannel);
    mocks.fetchDataByCursor.mockResolvedValue({
      items: [victimEvent],
      nextCursor: undefined,
    });
    const caller = await createCaller();

    await expect(
      caller.fetchEventsByCursor({
        workspaceId: attackerWorkspaceId,
        channelId: victimChannel.id,
      })
    ).rejects.toThrow('Channel not found');
  });

  test('rejects archiving an event from another workspace channel', async () => {
    const attackerWorkspaceId = createId();
    const victimChannel = channel({ workspaceId: createId() });
    mockVictimChannel(victimChannel);
    mocks.prisma.feedEvent.update.mockResolvedValue(
      event({ channelId: victimChannel.id, archived: true })
    );
    const caller = await createCaller();

    await expect(
      caller.archiveEvent({
        workspaceId: attackerWorkspaceId,
        channelId: victimChannel.id,
        eventId: 'event-id',
      })
    ).rejects.toThrow('Channel not found');
  });

  test('rejects clearing archived events from another workspace channel', async () => {
    const attackerWorkspaceId = createId();
    const victimChannel = channel({ workspaceId: createId() });
    mockVictimChannel(victimChannel);
    mocks.prisma.feedEvent.deleteMany.mockResolvedValue({ count: 1 });
    const caller = await createCaller();

    await expect(
      caller.clearAllArchivedEvents({
        workspaceId: attackerWorkspaceId,
        channelId: victimChannel.id,
      })
    ).rejects.toThrow('Channel not found');
  });

  test('rejects listing states from another workspace channel', async () => {
    const attackerWorkspaceId = createId();
    const victimChannel = channel({ workspaceId: createId() });
    mockVictimChannel(victimChannel);
    mocks.prisma.feedState.findMany.mockResolvedValue([
      state({ channelId: victimChannel.id }),
    ]);
    const caller = await createCaller();

    await expect(
      caller.state.all({
        workspaceId: attackerWorkspaceId,
        channelId: victimChannel.id,
      })
    ).rejects.toThrow('Channel not found');
  });

  test('rejects resolving a state from another workspace channel', async () => {
    const attackerWorkspaceId = createId();
    const victimChannel = channel({ workspaceId: createId() });
    mockVictimChannel(victimChannel);
    mocks.feedStateResolve.mockResolvedValue(
      state({ channelId: victimChannel.id, status: FeedStateStatus.Resolved })
    );
    const caller = await createCaller();

    await expect(
      caller.state.resolve({
        workspaceId: attackerWorkspaceId,
        channelId: victimChannel.id,
        stateId: 'state-id',
      })
    ).rejects.toThrow('Channel not found');
  });

  test('fetches events from a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    const currentEvent = event({ channelId: currentChannel.id });
    mockVictimChannel(currentChannel);
    mocks.fetchDataByCursor.mockResolvedValue({
      items: [currentEvent],
      nextCursor: undefined,
    });
    const caller = await createCaller();

    const result = await caller.fetchEventsByCursor({
      workspaceId,
      channelId: currentChannel.id,
    });

    expect(result.items).toEqual([currentEvent]);
  });

  test('archives an event in a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    mockVictimChannel(currentChannel);
    mocks.prisma.feedEvent.update.mockResolvedValue(
      event({ channelId: currentChannel.id, archived: true })
    );
    const caller = await createCaller();

    await expect(
      caller.archiveEvent({
        workspaceId,
        channelId: currentChannel.id,
        eventId: 'event-id',
      })
    ).resolves.toBeUndefined();
  });

  test('unarchives an event in a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    mockVictimChannel(currentChannel);
    mocks.prisma.feedEvent.update.mockResolvedValue(
      event({ channelId: currentChannel.id, archived: false })
    );
    const caller = await createCaller();

    await expect(
      caller.unarchiveEvent({
        workspaceId,
        channelId: currentChannel.id,
        eventId: 'event-id',
      })
    ).resolves.toBeUndefined();
  });

  test('clears archived events from a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    mockVictimChannel(currentChannel);
    mocks.prisma.feedEvent.deleteMany.mockResolvedValue({ count: 2 });
    const caller = await createCaller();

    const result = await caller.clearAllArchivedEvents({
      workspaceId,
      channelId: currentChannel.id,
    });

    expect(result).toBe(2);
  });

  test('lists states from a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    const currentState = state({ channelId: currentChannel.id });
    mockVictimChannel(currentChannel);
    mocks.prisma.feedState.findMany.mockResolvedValue([currentState]);
    const caller = await createCaller();

    const result = await caller.state.all({
      workspaceId,
      channelId: currentChannel.id,
    });

    expect(result).toEqual([currentState]);
  });

  test('resolves a state in a channel in the current workspace', async () => {
    const workspaceId = createId();
    const currentChannel = channel({ workspaceId });
    const resolvedState = state({
      channelId: currentChannel.id,
      status: FeedStateStatus.Resolved,
      resolvedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    mockVictimChannel(currentChannel);
    mocks.feedStateResolve.mockResolvedValue(resolvedState);
    const caller = await createCaller();

    const result = await caller.state.resolve({
      workspaceId,
      channelId: currentChannel.id,
      stateId: resolvedState.id,
    });

    expect(result).toEqual(resolvedState);
  });
});
