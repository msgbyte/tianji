import express from 'express';
import supertest from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execStoredWorker: vi.fn(),
  getWorker: vi.fn(),
}));

vi.mock('../../model/worker/index.js', () => ({
  execStoredWorker: mocks.execStoredWorker,
  getWorker: mocks.getWorker,
}));

vi.mock('../../utils/env.js', () => ({
  env: { enableFunctionWorker: true },
}));

import { workerRouter } from '../worker.js';

const worker = {
  id: 'worker-a',
  workspaceId: 'workspace-a',
  name: 'Worker A',
  description: null,
  code: 'async function fetch() { return { ok: true }; }',
  revision: 1,
  active: true,
  enableCron: false,
  cronExpression: null,
  visibility: 'Public',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('workerRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWorker.mockResolvedValue(worker);
    mocks.execStoredWorker.mockResolvedValue({
      responsePayload: { ok: true },
    });
  });

  test('uses route identities for HTTP execution scope instead of payload identities', async () => {
    const app = express();
    app.use(express.json());
    app.use(workerRouter);

    const response = await supertest(app)
      .post('/workspace-a/worker-a')
      .send({
        workspaceId: 'payload-workspace',
        workerId: 'payload-worker',
        value: 42,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(mocks.getWorker).toHaveBeenCalledWith('worker-a', 'workspace-a');
    expect(mocks.execStoredWorker).toHaveBeenCalledWith(
      worker,
      expect.objectContaining({
        workspaceId: 'payload-workspace',
        workerId: 'payload-worker',
      }),
      expect.objectContaining({
        type: 'http',
      })
    );
  });
});
