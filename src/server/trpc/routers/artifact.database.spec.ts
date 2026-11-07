import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';

vi.mock('../../middleware/auth.js', () => ({ jwtVerify: vi.fn() }));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({
  verifyUserApiKey: async () => ({
    id: 'artifacttestauthor',
    username: 'artifact-test',
    role: 'user',
  }),
}));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: async () => ({ role: 'owner' }),
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => () => {} },
}));
vi.mock('../../middleware/authRateLimit.js', () => ({
  authRateLimitProcedures: {},
}));
vi.mock('../../model/_client.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  return {
    prisma: new PrismaClient({
      datasourceUrl:
        process.env.ARTIFACT_TEST_DATABASE_URL ??
        'postgresql://localhost/unused',
    }),
  };
});
const { prisma } = await import('../../model/_client.js');
const { artifactRouter } = await import('./artifact.js');
const { router } = await import('../trpc.js');
const enabled = Boolean(process.env.ARTIFACT_TEST_DATABASE_URL);
const workspaceId = createId();
beforeAll(async () => {
  if (!enabled) return;
  await prisma.workspace.create({
    data: { id: workspaceId, name: 'Artifact integration test' },
  });
  await prisma.user.create({
    data: {
      id: 'artifacttestauthor',
      username: 'artifact-test',
      password: 'unused',
      role: 'user',
    },
  });
});
afterAll(async () => {
  if (enabled) {
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.workspaceAuditLog.deleteMany({
      where: { content: { contains: 'artifacttestauthor' } },
    });
    await prisma.user.deleteMany({ where: { id: 'artifacttestauthor' } });
  }
  await prisma.$disconnect();
});

test.skipIf(!enabled)(
  'PostgreSQL allows one revision winner and retains artifacts after deleting their author',
  async () => {
    const caller = router({ artifact: artifactRouter }).createCaller({
      token: 'sk_test',
      timezone: 'utc',
      language: 'en',
      req: {} as any,
      origin: '',
    }).artifact;
    const content = {
      workspaceId,
      title: 'Report',
      description: '',
      source: '<h1>Initial</h1>',
    };
    const created = await caller.create(content);
    const results = await Promise.allSettled(
      ['First', 'Second'].map((title) =>
        caller.update({
          ...content,
          title,
          source: `<h1>${title}</h1>`,
          artifactId: created.id,
          expectedRevision: 1,
        })
      )
    );
    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    const loser = results.find(
      (result) => result.status === 'rejected'
    ) as PromiseRejectedResult;
    expect(loser.reason.code).toBe('CONFLICT');
    const winner = results.find(
      (result) => result.status === 'fulfilled'
    ) as PromiseFulfilledResult<{ title: string }>;
    expect(
      await caller.get({ workspaceId, artifactId: created.id })
    ).toMatchObject({
      revision: 2,
      title: winner.value.title,
      source: `<h1>${winner.value.title}</h1>`,
    });
    const logs = await prisma.workspaceAuditLog.findMany({
      where: { workspaceId },
    });
    expect(logs).toHaveLength(2);
    expect(
      logs.every(
        (log) => log.relatedId === created.id && !log.content.includes('<h1>')
      )
    ).toBe(true);
    await prisma.user.delete({ where: { id: 'artifacttestauthor' } });
    expect(
      await prisma.artifact.findUnique({ where: { id: created.id } })
    ).toMatchObject({ createdById: null, updatedById: null });
  }
);
