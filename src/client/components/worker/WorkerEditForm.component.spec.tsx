import { describe, expect, test } from 'vitest';
import { buildWorkerTestCodeInput } from './workerTestCodeInput';

describe('WorkerEditForm test-code input', () => {
  test('includes the worker ID for edit-mode environment drafts', () => {
    expect(
      buildWorkerTestCodeInput(
        { workerId: 'worker-a' },
        {
          workspaceId: 'workspace-a',
          code: 'return context.env.TOKEN;',
          environmentVariables: [
            {
              id: 'secret-a',
              key: 'TOKEN',
              type: 'Secret',
              hasValue: true,
            },
          ],
        }
      )
    ).toEqual({
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      code: 'return context.env.TOKEN;',
      environmentVariables: [
        {
          id: 'secret-a',
          key: 'TOKEN',
          type: 'Secret',
          hasValue: true,
        },
      ],
    });
  });
});
