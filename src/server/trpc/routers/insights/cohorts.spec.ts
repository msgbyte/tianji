import { createId } from '@paralleldrive/cuid2';
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
    prisma: {
      warehouseCohorts: {
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
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

vi.mock('../../../model/insights/warehouse/cohorts.js', () => ({
  getAllCohorts: vi.fn(),
}));

function cohort(overrides: Partial<any> = {}) {
  return {
    id: 'cohort-id',
    name: 'Customers',
    workspaceId: createId(),
    warehouseApplicationId: 'app-id',
    filter: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function matchesTenant(where: any, item: { id: string; workspaceId: string }) {
  return (
    where.id === item.id &&
    (where.workspaceId === undefined || where.workspaceId === item.workspaceId)
  );
}

async function createCaller() {
  const { insightCohortsRouter } = await import('./cohorts.js');

  return insightCohortsRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetModules();
});

describe('warehouse cohort authorization', () => {
  test('updates a cohort that belongs to the current workspace', async () => {
    const workspaceId = createId();
    const currentCohort = cohort({ workspaceId });
    const updatedCohort = cohort({ workspaceId, name: 'Active customers' });
    mocks.prisma.warehouseCohorts.update.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, currentCohort)) {
          return updatedCohort;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    const result = await caller.upsert({
      workspaceId,
      id: currentCohort.id,
      name: updatedCohort.name,
      warehouseApplicationId: currentCohort.warehouseApplicationId,
      filter: [],
    });

    expect(result).toEqual(updatedCohort);
  });

  test('deletes a cohort that belongs to the current workspace', async () => {
    const workspaceId = createId();
    const currentCohort = cohort({ workspaceId });
    mocks.prisma.warehouseCohorts.delete.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, currentCohort)) {
          return currentCohort;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    const result = await caller.delete({
      workspaceId,
      id: currentCohort.id,
    });

    expect(result).toEqual(currentCohort);
  });

  test('rejects updating a cohort that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimCohort = cohort({ workspaceId: createId() });
    mocks.prisma.warehouseCohorts.update.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, victimCohort)) {
          return victimCohort;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    await expect(
      caller.upsert({
        workspaceId: attackerWorkspaceId,
        id: victimCohort.id,
        name: 'Hijacked',
        warehouseApplicationId: victimCohort.warehouseApplicationId,
        filter: [],
      })
    ).rejects.toThrow('Record not found');
  });

  test('rejects deleting a cohort that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimCohort = cohort({ workspaceId: createId() });
    mocks.prisma.warehouseCohorts.delete.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, victimCohort)) {
          return victimCohort;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    await expect(
      caller.delete({
        workspaceId: attackerWorkspaceId,
        id: victimCohort.id,
      })
    ).rejects.toThrow('Record not found');
  });
});
