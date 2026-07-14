import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  testConnectionMutate: vi.fn(),
  testConnectionOptions: { current: null as any },
  toastSuccess: vi.fn(),
  defaultErrorHandler: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    (options: Record<string, unknown>) => ({
      ...options,
      useParams: () => ({ gatewayId: 'gateway_1' }),
    }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess },
}));

vi.mock('@/utils/route', () => ({ routeAuthBeforeLoad: vi.fn() }));
vi.mock('@/store/user', () => ({ useCurrentWorkspaceId: () => 'workspace_1' }));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: mocks.defaultErrorHandler,
  trpc: {
    useUtils: () => ({ aiGateway: { all: { refetch: vi.fn() } } }),
    aiGateway: {
      info: {
        useQuery: () => ({
          isLoading: false,
          data: {
            id: 'gateway_1',
            name: 'Gateway',
            modelApiKey: 'sk-existing',
            customModelBaseUrl: 'https://models.example.com/v1',
            customModelName: 'old-model',
            customModelStrategy: null,
            customModelInputPrice: null,
            customModelOutputPrice: null,
          },
        }),
      },
      update: {
        useMutation: () => ({ mutateAsync: vi.fn() }),
      },
      testConnection: {
        useMutation: (options: unknown) => {
          mocks.testConnectionOptions.current = options;
          return {
            mutate: mocks.testConnectionMutate,
            isPending: true,
          };
        },
      },
    },
  },
}));

vi.mock('@/components/CommonWrapper', () => ({
  CommonWrapper: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ErrorTip', () => ({ ErrorTip: () => <div>Error</div> }));
vi.mock('@/components/Loading', () => ({ Loading: () => <div>Loading</div> }));
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/aiGateway/AIGatewayStrategyEditor.utils', () => ({
  parseAIGatewayCustomModelStrategy: vi.fn(),
  stringifyAIGatewayCustomModelStrategy: () => '',
}));
vi.mock('@/components/aiGateway/AIGatewayEditForm', () => ({
  AIGatewayEditForm: (props: any) => (
    <div>
      <span data-testid="testing-state">
        {String(props.isTestingConnection)}
      </span>
      <button
        type="button"
        onClick={() =>
          props.onTestConnection({
            name: 'Gateway',
            modelApiKey: 'sk-current',
            customModelBaseUrl: '',
            customModelName: 'current-model',
            customModelStrategy: '',
            customModelInputPrice: null,
            customModelOutputPrice: null,
          })
        }
      >
        Trigger Test
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.testConnectionOptions.current = null;
});

describe('AI Gateway edit route connection test', () => {
  test('sends normalized current values and configures feedback', async () => {
    const { Route } = await import(
      '../../routes/aiGateway/$gatewayId/edit'
    );
    const Component = (Route as any).component;
    render(<Component />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Test' }));

    expect(mocks.testConnectionMutate).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      gatewayId: 'gateway_1',
      modelApiKey: 'sk-current',
      customModelBaseUrl: null,
      customModelName: 'current-model',
    });
    expect(screen.getByTestId('testing-state')).toHaveTextContent('true');

    mocks.testConnectionOptions.current.onSuccess({
      model: 'current-model',
      durationMs: 42,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Connection successful', {
      description: 'Model: current-model · 42 ms',
    });
    expect(mocks.testConnectionOptions.current.onError).toBe(
      mocks.defaultErrorHandler
    );
  });
});
