import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getWorker: vi.fn(),
  execWorker: vi.fn(),
  execStoredWorker: vi.fn(),
}));

vi.mock('../model/worker/index.js', () => ({
  getWorker: mocks.getWorker,
  execWorker: mocks.execWorker,
  execStoredWorker: mocks.execStoredWorker,
}));

vi.mock('../utils/env.js', () => ({
  env: { enableFunctionWorker: true },
}));

import { workerRouter } from './worker.js';

describe('public HTTP worker execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.execStoredWorker.mockResolvedValue({
      responsePayload: { ok: true },
    });
  });

  test('delegates the loaded worker and HTTP request data to stored execution', async () => {
    const worker = {
      id: 'worker-a',
      workspaceId: 'workspace-a',
      name: 'HTTP Worker',
      description: null,
      code: 'async function fetch(payload, context) { return context.env.TOKEN; }',
      revision: 1,
      active: true,
      enableCron: false,
      cronExpression: null,
      visibility: 'Public',
      createdAt: new Date('2026-08-15T00:00:00.000Z'),
      updatedAt: new Date('2026-08-15T00:00:00.000Z'),
    };
    mocks.getWorker.mockResolvedValue(worker);
    const app = express();
    app.use(express.json());
    app.use(workerRouter);

    const response = await request(app)
      .post('/workspace-a/worker-a?queryValue=from-query')
      .set('x-worker-test', 'header-value')
      .send({ bodyValue: 'from-body' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(mocks.execStoredWorker).toHaveBeenCalledWith(
      worker,
      { queryValue: 'from-query', bodyValue: 'from-body' },
      {
        type: 'http',
        request: {
          method: 'POST',
          url: '/workspace-a/worker-a?queryValue=from-query',
          headers: expect.objectContaining({
            'x-worker-test': 'header-value',
          }),
        },
      }
    );
    expect(mocks.execWorker).not.toHaveBeenCalled();
  });
});
