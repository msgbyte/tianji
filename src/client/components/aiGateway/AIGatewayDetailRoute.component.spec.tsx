import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Route } from '../../routes/aiGateway/$gatewayId/index';

const mocks = vi.hoisted(() => ({
  hasAdminPermission: true,
  hasWritePermission: true,
  navigate: vi.fn(),
  deleteGateway: vi.fn(),
  refetchGateways: vi.fn(),
  actionsMenuProps: { current: null as any },
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useParams: () => ({ gatewayId: 'gateway_1' }),
  }),
  Link: ({ children, to, params }: any) => (
    <a href={to.replace('$gatewayId', params.gatewayId)}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/utils/route', () => ({ routeAuthBeforeLoad: vi.fn() }));
vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
  useHasAdminPermission: () => mocks.hasAdminPermission,
  useHasWritePermission: () => mocks.hasWritePermission,
}));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: vi.fn(),
  trpc: {
    useUtils: () => ({
      aiGateway: { all: { refetch: mocks.refetchGateways } },
    }),
    aiGateway: {
      info: {
        useQuery: () => ({
          isLoading: false,
          data: { id: 'gateway_1', name: 'Primary Gateway' },
        }),
      },
      delete: {
        useMutation: () => ({ mutateAsync: mocks.deleteGateway }),
      },
    },
  },
}));

vi.mock('@/components/CommonWrapper', () => ({
  CommonWrapper: ({ header }: { header: React.ReactNode }) => (
    <div>{header}</div>
  ),
}));
vi.mock('@/components/CommonHeader', () => ({
  CommonHeader: ({ actions }: { actions: React.ReactNode }) => (
    <div>{actions}</div>
  ),
}));
vi.mock('@/components/aiGateway/AIGatewayCodeExampleBtn', () => ({
  AIGatewayCodeExampleBtn: () => <div>Code example</div>,
}));
vi.mock('@/components/aiGateway/AIGatewayActionsMenu', () => ({
  AIGatewayActionsMenu: (props: unknown) => {
    mocks.actionsMenuProps.current = props;
    return <div aria-label="AI Gateway actions" />;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasAdminPermission = true;
  mocks.hasWritePermission = true;
  mocks.actionsMenuProps.current = null;
  mocks.deleteGateway.mockResolvedValue(undefined);
  mocks.refetchGateways.mockResolvedValue(undefined);
});

describe('AI Gateway detail route actions', () => {
  test('shows Code Example and the actions menu to workspace administrators', async () => {
    const Component = (Route as any).component;

    render(<Component />);

    expect(screen.getByText('Code example')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Gateway actions')).toBeInTheDocument();
    expect(mocks.actionsMenuProps.current.canEdit).toBe(true);
    expect(mocks.actionsMenuProps.current.canDelete).toBe(true);

    act(() => mocks.actionsMenuProps.current.onEdit());
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/aiGateway/$gatewayId/edit',
      params: { gatewayId: 'gateway_1' },
    });

    await act(() => mocks.actionsMenuProps.current.onDelete());
    expect(mocks.deleteGateway).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      gatewayId: 'gateway_1',
    });
    expect(mocks.refetchGateways).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
    });
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      to: '/aiGateway',
      replace: true,
    });
    expect(mocks.deleteGateway.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.refetchGateways.mock.invocationCallOrder[0]
    );
    expect(mocks.refetchGateways.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.navigate.mock.invocationCallOrder[1]
    );
  });

  test('allows writers to edit without deletion rights', () => {
    mocks.hasAdminPermission = false;
    const Component = (Route as any).component;
    render(<Component />);
    expect(mocks.actionsMenuProps.current.canEdit).toBe(true);
    expect(mocks.actionsMenuProps.current.canDelete).toBe(false);
  });

  test('keeps the actions menu available to read-only members', () => {
    mocks.hasAdminPermission = false;
    mocks.hasWritePermission = false;
    const Component = (Route as any).component;

    render(<Component />);

    expect(screen.getByText('Code example')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Gateway actions')).toBeInTheDocument();
    expect(mocks.actionsMenuProps.current.canEdit).toBe(false);
    expect(mocks.actionsMenuProps.current.canDelete).toBe(false);
  });
});
