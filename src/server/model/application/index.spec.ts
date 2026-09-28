import { Prisma, type ApplicationSession } from '@prisma/client';
import type { Request } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../_client.js';
import { hashUuid } from '../../utils/common.js';
import { findSession } from './index.js';

vi.mock('../_client.js', () => ({
  prisma: {
    application: { findUnique: vi.fn() },
    applicationSession: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock('../../cache/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buildQueryWithCache: (_name: string, get: unknown) => ({
    get,
    del: vi.fn(),
    update: vi.fn(),
  }),
}));

const applicationId = 'clnzoxcy10001vy2ohi4obbi0';
const workspaceId = 'workspace-id';
const ip = '127.0.0.1';
const userAgent = 'Tianji Application Test';
const req = {
  headers: {
    'cf-connecting-ip': ip,
    'user-agent': userAgent,
    'accept-language': 'es-ES',
  },
} as unknown as Request;
const body = {
  payload: { application: applicationId, language: 'es', os: 'ios' },
};
const session: ApplicationSession = {
  id: hashUuid(applicationId, ip, userAgent),
  applicationId,
  ip,
  language: 'es',
  os: 'ios',
  version: '1.0.0',
  sdkVersion: null,
  country: null,
  subdivision1: null,
  subdivision2: null,
  city: null,
  longitude: null,
  latitude: null,
  accuracyRadius: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: null,
};
const conflict = new Prisma.PrismaClientKnownRequestError(
  'Unique constraint failed on the fields: (`id`)',
  {
    code: 'P2002',
    clientVersion: Prisma.prismaVersion.client,
    meta: { target: ['id'] },
  }
);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.application.findUnique).mockResolvedValue({
    id: applicationId,
    workspaceId,
    name: 'Test Application',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  });
});

describe('application session creation', () => {
  test('reuses the winning session when concurrent requests race to create it', async () => {
    vi.mocked(prisma.applicationSession.findUnique)
      .mockResolvedValue(session)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.applicationSession.upsert)
      .mockResolvedValueOnce(session)
      .mockRejectedValueOnce(conflict);

    await expect(
      Promise.all([findSession(req, body), findSession(req, body)])
    ).resolves.toEqual([
      { ...session, workspaceId },
      { ...session, workspaceId },
    ]);
    expect(prisma.applicationSession.findUnique).toHaveBeenLastCalledWith({
      where: { id: session.id },
    });
  });

  test('preserves the conflict if the winning session cannot be found', async () => {
    vi.mocked(prisma.applicationSession.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.applicationSession.upsert).mockRejectedValue(conflict);

    await expect(findSession(req, body)).rejects.toBe(conflict);
  });

  test.each([
    new Error('Database connection failed'),
    new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: Prisma.prismaVersion.client,
    }),
  ])('does not hide other database errors: %s', async (error) => {
    vi.mocked(prisma.applicationSession.findUnique)
      .mockResolvedValue(session)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.applicationSession.upsert).mockRejectedValue(error);

    await expect(findSession(req, body)).rejects.toBe(error);
    expect(prisma.applicationSession.findUnique).toHaveBeenCalledTimes(1);
  });
});
