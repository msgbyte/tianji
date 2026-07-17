import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasAdminPermission: true,
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

vi.mock('@/utils/route', () => ({ routeAuthBeforeLoad: vi.fn() }));
vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
  useHasAdminPermission: () => mocks.hasAdminPermission,
}));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: vi.fn(),
  trpc: {
    useUtils: () => ({ aiGateway: { all: { refetch: vi.fn() } } }),
    aiGateway: {
      info: {
        useQuery: () => ({
          isLoading: false,
          data: { id: 'gateway_1', name: 'Primary Gateway' },
        }),
      },
      delete: {
        useMutation: () => ({ mutateAsync: vi.fn() }),
      },
    },
  },
}));

vi.mock('@/components/CommonWrapper', () => ({
  CommonWrapper: ({ header }: { header: React.ReactNode }) => <div>{header}</div>,
}));
vi.mock('@/components/CommonHeader', () => ({
  CommonHeader: ({ actions }: { actions: React.ReactNode }) => (
    <div>{actions}</div>
  ),
}));
vi.mock('@/components/aiGateway/AIGatewayCodeExampleBtn', () => ({
  AIGatewayCodeExampleBtn: () => <div>Code example</div>,
}));
vi.mock('@/components/aiGateway/AIGatewayDuplicateDialog', () => ({
  AIGatewayDuplicateDialog: () => <div aria-label="Duplicate action" />,
}));
vi.mock('@/components/AlertConfirm', () => ({
  AlertConfirm: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({
    Icon: _Icon,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    Icon?: React.ComponentType;
  }) => <button {...props} />,
}));

beforeEach(() => {
  mocks.hasAdminPermission = true;
});

describe('AI Gateway detail route duplicate action', () => {
  test('shows the duplicate action to workspace administrators', async () => {
    const { Route } = await import('../../routes/aiGateway/$gatewayId/index');
    const Component = (Route as any).component;

    render(<Component />);

    expect(screen.getByLabelText('Duplicate action')).toBeInTheDocument();
  });

  test('hides the duplicate action from non-administrators', async () => {
    mocks.hasAdminPermission = false;
    const { Route } = await import('../../routes/aiGateway/$gatewayId/index');
    const Component = (Route as any).component;

    render(<Component />);

    expect(screen.queryByLabelText('Duplicate action')).not.toBeInTheDocument();
  });
});
