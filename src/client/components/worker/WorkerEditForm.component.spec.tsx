import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  WorkerEditForm,
  type WorkerEditFormValues,
} from './WorkerEditForm';
import { buildWorkerTestCodeInput } from './workerTestCodeInput';
import { Route as WorkerEditRoute } from '@/routes/worker/$workerId/edit';

const mocks = vi.hoisted(() => ({
  environmentVariables: [
    {
      id: 'env-text',
      key: 'TOKEN',
      type: 'Text' as const,
      value: 'server-value',
    },
  ],
  moduleBindings: [] as Array<{
    id: string;
    moduleId: string;
    moduleRevisionId: string;
    typeDeclaration: string;
  }>,
  moduleOptions: [] as Array<{
    id: string;
    revisions: Array<{
      id: string;
      typeDeclaration: string;
    }>;
  }>,
  navigate: vi.fn(),
  refetchEnvironmentVariables: vi.fn(),
  refetchWorker: vi.fn(),
  testCode: vi.fn(),
  toastSuccess: vi.fn(),
  upsert: vi.fn(),
  validateCronPreview: vi.fn(),
  workerId: 'worker-a',
  worker: {
    id: 'worker-a',
    workspaceId: 'workspace-a',
    name: 'Worker',
    description: null,
    code: 'async function fetch() {}',
    active: true,
    enableCron: false,
    cronExpression: null,
    visibility: 'Private' as const,
    createdAt: new Date('2026-08-15T00:00:00.000Z'),
    updatedAt: new Date('2026-08-15T00:00:00.000Z'),
  },
  workspaceMembers: [
    {
      userId: 'userid123',
      role: 'readOnly',
      user: {
        username: 'user',
        nickname: 'Worker Owner',
        avatar: 'https://example.com/avatar.png',
      },
    },
  ],
}));

vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => key,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: vi.fn(),
  trpc: {
    useUtils: () => ({
      worker: {
        all: { invalidate: vi.fn() },
        get: { refetch: mocks.refetchWorker },
        getEnvironmentVariables: {
          refetch: mocks.refetchEnvironmentVariables,
        },
        getModuleBindings: { refetch: vi.fn() },
      },
      sharedModule: {
        all: { invalidate: vi.fn() },
        consumers: { invalidate: vi.fn() },
      },
    }),
    worker: {
      get: {
        useQuery: () => ({ data: mocks.worker, isLoading: false }),
      },
      getEnvironmentVariables: {
        useQuery: () => ({
          data: mocks.environmentVariables,
          isLoading: false,
        }),
      },
      getModuleBindings: {
        useQuery: () => ({ data: mocks.moduleBindings, isLoading: false }),
      },
      testCode: {
        useMutation: () => ({ mutateAsync: mocks.testCode }),
      },
      upsert: {
        useMutation: (options?: { onSuccess?: () => void | Promise<void> }) => ({
          mutateAsync: async (input: unknown) => {
            mocks.upsert(input);
            await options?.onSuccess?.();
            return mocks.worker;
          },
        }),
      },
    },
    sharedModule: {
      bindingOptions: {
        useQuery: () => ({ data: mocks.moduleOptions }),
      },
    },
    workspace: {
      members: {
        useQuery: () => ({ data: mocks.workspaceMembers }),
      },
    },
  },
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace-a',
  useHasAdminPermission: () => true,
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    (options: Record<string, unknown>) => ({
      ...options,
      useParams: () => ({ workerId: mocks.workerId }),
    }),
  useNavigate: () => mocks.navigate,
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess },
}));

vi.mock('@/components/CommonWrapper', () => ({
  CommonWrapper: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/CommonHeader', () => ({
  CommonHeader: () => null,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/Loading', () => ({ Loading: () => null }));
vi.mock('@/components/ErrorTip', () => ({ ErrorTip: () => null }));
vi.mock('@/utils/route', () => ({ routeAuthBeforeLoad: vi.fn() }));

vi.mock('@/components/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    extraLibraries,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    extraLibraries?: Array<{ content: string; filePath: string }>;
  }) => (
    <>
      <textarea
        aria-label="Code editor"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {extraLibraries?.map((library) => (
        <output key={library.filePath} data-testid="code-editor-extra-library">
          {library.content}
        </output>
      ))}
    </>
  ),
}));

vi.mock('@/components/ui/fullscreen-modal', () => ({
  FullscreenModal: () => null,
}));

vi.mock('@/components/worker/WorkerExecutionDetail', () => ({
  WorkerExecutionDetail: () => null,
}));

vi.mock('./useCronPreview', () => ({
  useCronPreview: () => ({
    previewTimes: [],
    error: null,
    isLoading: false,
    validate: mocks.validateCronPreview,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.testCode.mockResolvedValue({});
  mocks.refetchEnvironmentVariables.mockResolvedValue({});
  mocks.refetchWorker.mockResolvedValue({});
  mocks.validateCronPreview.mockResolvedValue(undefined);
  mocks.workerId = 'worker-a';
  mocks.worker.id = 'worker-a';
  mocks.worker.name = 'Worker';
  mocks.environmentVariables[0].value = 'server-value';
  mocks.moduleBindings.length = 0;
  mocks.moduleOptions.length = 0;
});

function createDefaultValues(
  environmentValue: string
): Partial<WorkerEditFormValues> {
  return {
    name: 'Worker',
    description: '',
    code: 'async function fetch() {}',
    active: true,
    enableCron: false,
    cronExpression: '',
    visibility: 'Private',
    environmentVariables: [
      {
        id: 'env-text',
        key: 'TOKEN',
        type: 'Text',
        value: environmentValue,
      },
    ],
  };
}

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

describe('WorkerEditForm worker entry migration', () => {
  test('migrates a legacy fetch function with one click', async () => {
    const user = userEvent.setup();

    render(
      <WorkerEditForm
        defaultValues={{
          ...createDefaultValues('server-value'),
          code: `async function fetch(payload, context) {
  return { payload, context };
}`,
        }}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Migrate to Module Worker' })
    );

    expect(screen.getByLabelText('Code editor')).toHaveValue(
      `export default {
  async fetch(payload, context) {
    return { payload, context };
  },
} satisfies TianjiWorker;`
    );
    expect(
      screen.queryByRole('button', { name: 'Migrate to Module Worker' })
    ).not.toBeInTheDocument();
  });
});

describe('WorkerEditForm shared module types', () => {
  test('loads every available module declaration without a binding field', () => {
    mocks.moduleOptions.push(
      {
        id: 'module-a',
        revisions: [
          {
            id: 'revision-a',
            typeDeclaration: "declare module '@shared/a' {}",
          },
        ],
      },
      {
        id: 'module-b',
        revisions: [
          {
            id: 'revision-b',
            typeDeclaration: "declare module '@shared/b' {}",
          },
        ],
      }
    );

    render(
      <WorkerEditForm
        defaultValues={createDefaultValues('server-value')}
        onSubmit={vi.fn()}
      />
    );

    expect(
      screen
        .getAllByTestId('code-editor-extra-library')
        .map((item) => item.textContent)
    ).toEqual([
      "declare module '@shared/a' {}",
      "declare module '@shared/b' {}",
    ]);
    expect(screen.queryByText('Shared Modules')).not.toBeInTheDocument();
  });
});

describe('WorkerEditForm server snapshot updates', () => {
  test('resets a pristine form when a newer server snapshot arrives', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <WorkerEditForm
        workerId="worker-a"
        defaultValues={createDefaultValues('cached-value')}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText('TOKEN value')).toHaveValue('cached-value');

    rerender(
      <WorkerEditForm
        workerId="worker-a"
        defaultValues={createDefaultValues('refetched-value')}
        onSubmit={onSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('TOKEN value')).toHaveValue(
        'refetched-value'
      );
    });
  });

  test('does not reset over active dirty edits', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <WorkerEditForm
        workerId="worker-a"
        defaultValues={createDefaultValues('cached-value')}
        onSubmit={onSubmit}
      />
    );
    const valueInput = screen.getByLabelText('TOKEN value');

    await user.clear(valueInput);
    await user.type(valueInput, 'local-dirty-value');

    rerender(
      <WorkerEditForm
        workerId="worker-a"
        defaultValues={createDefaultValues('refetched-value')}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText('TOKEN value')).toHaveValue(
      'local-dirty-value'
    );
  });
});

describe('WorkerEditForm empty environment values', () => {
  test.each([
    {
      type: 'Text' as const,
      environmentVariables: [
        {
          id: 'env-text',
          key: 'EMPTY_TEXT',
          type: 'Text' as const,
          value: '',
        },
      ],
    },
    {
      type: 'Secret' as const,
      environmentVariables: [
        { key: 'EMPTY_SECRET', type: 'Secret' as const, value: '' },
      ],
    },
  ])(
    'submits an explicitly empty $type value',
    async ({ environmentVariables }) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <WorkerEditForm
          defaultValues={{
            ...createDefaultValues('server-value'),
            environmentVariables,
          }}
          onSubmit={onSubmit}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Create Worker' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ environmentVariables })
        );
      });
    }
  );
});

describe('WorkerEditForm owner field', () => {
  test('hides the owner field when creating a worker', () => {
    render(
      <WorkerEditForm
        defaultValues={createDefaultValues('server-value')}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });

  test('shows the owner field when editing a worker', () => {
    render(
      <WorkerEditForm
        workerId="worker-a"
        defaultValues={{
          ...createDefaultValues('server-value'),
          ownerId: 'userid123',
        }}
        onSubmit={vi.fn()}
      />
    );

    const codeLabel = screen.getByText('JavaScript Code');
    const ownerLabel = screen.getByText('Owner');

    expect(ownerLabel).toBeInTheDocument();
    expect(screen.getByText('Worker Owner')).toBeInTheDocument();
    expect(
      codeLabel.compareDocumentPosition(ownerLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe('Worker edit route cache refresh', () => {
  test('refreshes both exact worker queries before navigation', async () => {
    const user = userEvent.setup();
    let resolveWorkerRefetch = () => {};
    let resolveEnvironmentRefetch = () => {};
    mocks.refetchWorker.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveWorkerRefetch = resolve;
      })
    );
    mocks.refetchEnvironmentVariables.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveEnvironmentRefetch = resolve;
      })
    );
    const PageComponent = (
      WorkerEditRoute as unknown as { component: React.ComponentType }
    ).component;

    render(<PageComponent />);
    await user.click(screen.getByRole('button', { name: 'Update Worker' }));

    await waitFor(() => {
      expect(mocks.refetchWorker).toHaveBeenCalled();
      expect(mocks.refetchEnvironmentVariables).toHaveBeenCalled();
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.refetchWorker).toHaveBeenCalledWith({
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
    });
    expect(mocks.refetchEnvironmentVariables).toHaveBeenCalledWith({
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
    });

    resolveWorkerRefetch();
    resolveEnvironmentRefetch();
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalled();
    });
    expect(mocks.refetchWorker.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.navigate.mock.invocationCallOrder[0]
    );
    expect(
      mocks.refetchEnvironmentVariables.mock.invocationCallOrder[0]
    ).toBeLessThan(mocks.navigate.mock.invocationCallOrder[0]);
  });

  test('remounts the form when the route changes to another worker', async () => {
    const user = userEvent.setup();
    const PageComponent = (
      WorkerEditRoute as unknown as { component: React.ComponentType }
    ).component;
    const { rerender } = render(<PageComponent />);
    const valueInput = screen.getByLabelText('TOKEN value');

    await user.clear(valueInput);
    await user.type(valueInput, 'worker-a-dirty-value');

    mocks.workerId = 'worker-b';
    mocks.worker.id = 'worker-b';
    mocks.worker.name = 'Worker B';
    mocks.environmentVariables[0].value = 'worker-b-server-value';
    rerender(<PageComponent />);

    await waitFor(() => {
      expect(screen.getByLabelText('TOKEN value')).toHaveValue(
        'worker-b-server-value'
      );
    });
  });
});
