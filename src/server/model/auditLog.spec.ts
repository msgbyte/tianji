import { WorkspaceAuditLogType } from '@prisma/client';
import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('./_client.js', () => ({
  prisma: { workspaceAuditLog: { create: mocks.create } },
}));

const { createWorkspaceMutationAuditLog } = await import('./auditLog.js');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue(undefined);
});

test('uses an explicit target while redacting submitted secrets', async () => {
  await createWorkspaceMutationAuditLog({
    workspaceId: 'workspace-id',
    path: 'user.updateApiKeyDescription',
    input: { apiKey: 'secret-key', description: 'automation' },
    actor: { id: 'user-id', username: 'user' },
    relatedId: 'user-id',
    relatedType: WorkspaceAuditLogType.User,
  });

  expect(mocks.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      relatedId: 'user-id',
      relatedType: WorkspaceAuditLogType.User,
      content: expect.stringContaining('"apiKey":"[REDACTED]"'),
    }),
  });
  expect(mocks.create.mock.calls[0][0].data.content).not.toContain('secret-key');
});

test('redacts nested warehouse database URLs', async () => {
  await createWorkspaceMutationAuditLog({
    workspaceId: 'workspace-id',
    path: 'workspaceConfig.setConfig',
    input: {
      key: 'warehouse',
      value: {
        defaultDatabaseUrl: 'clickhouse://admin:password@default.example/db',
        applications: [
          {
            applicationId: 'application-id',
            databaseUrl: 'clickhouse://app:password@app.example/db',
          },
        ],
      },
    },
    actor: { id: 'user-id', username: 'user' },
  });

  const content = mocks.create.mock.calls[0][0].data.content;
  expect(content).toContain('"defaultDatabaseUrl":"[REDACTED]"');
  expect(content).toContain('"databaseUrl":"[REDACTED]"');
  expect(content).not.toContain('clickhouse://');
});
