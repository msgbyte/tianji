import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

const inviteMutateAsync = vi.fn();
const invalidateMembers = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    (options: Record<string, unknown>) => ({
      ...options,
    }),
  Link: ({
    children,
    to,
    ...rest
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) {
        return key;
      }
      return Object.entries(params).reduce(
        (acc, [paramKey, val]) => acc.replace(`{{${paramKey}}}`, String(val)),
        key
      );
    },
  }),
}));

vi.mock('@/utils/route', () => ({ routeAuthBeforeLoad: vi.fn() }));

vi.mock('@/store/user', () => ({
  useCurrentWorkspace: () => ({
    id: 'workspace_1',
    name: 'Workspace',
    role: 'readOnly',
    settings: {},
  }),
  useHasAdminPermission: () => true,
  useIsWorkspaceOwner: () => false,
  useUserStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      updateCurrentWorkspaceName: vi.fn(),
      updateCurrentWorkspaceSettings: vi.fn(),
    }),
}));

vi.mock('@/api/trpc', () => {
  const defaultMutation = () => ({ mutateAsync: vi.fn() });

  return {
    defaultErrorHandler: vi.fn(),
    defaultSuccessHandler: vi.fn(),
    trpc: {
      useUtils: () => ({
        workspace: { members: { invalidate: invalidateMembers } },
      }),
      workspace: {
        invite: { useMutation: () => ({ mutateAsync: inviteMutateAsync }) },
        rename: { useMutation: defaultMutation },
        delete: { useMutation: defaultMutation },
        updateSettings: { useMutation: defaultMutation },
        recheckPauseStatus: { useMutation: defaultMutation },
      },
    },
  };
});

vi.mock('@/components/workspace/useWorkspaceMembers', () => ({
  useWorkspaceMembers: () => ({ tableEl: null, memberCount: 3 }),
}));

vi.mock('@/hooks/useConfig', () => ({
  useGlobalConfig: () => ({ smtpAvailable: false }),
}));

vi.mock('@/utils/date', () => ({ getTimezoneList: () => [] }));

vi.mock('antd', () => ({
  Typography: {
    Text: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

describe('Workspace member invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteMutateAsync.mockResolvedValue(undefined);
  });

  test('defaults to User ID mode without SMTP warning and submits trimmed User ID', async () => {
    const user = userEvent.setup();
    const { Route } = await import('../routes/settings/workspace');
    const Component = (Route as any).component;

    render(
      <TooltipProvider delayDuration={0}>
        <Component />
      </TooltipProvider>
    );

    expect(screen.getByText('Instant · No SMTP needed')).toBeInTheDocument();
    expect(
      screen.getByText('Settings → Profile → User ID')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('SMTP is not configured on this server')
    ).not.toBeInTheDocument();

    const input = screen.getByLabelText('User ID');
    await user.type(input, '  cm4x9k2p80001tjn9w3z8b4e1  ');
    await user.click(screen.getByRole('button', { name: 'Add Member' }));

    await waitFor(() => {
      expect(inviteMutateAsync).toHaveBeenCalledWith({
        workspaceId: 'workspace_1',
        emailOrId: 'cm4x9k2p80001tjn9w3z8b4e1',
        role: 'readOnly',
      });
    });
    expect(invalidateMembers).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
    });
  });

  test('validates empty and mismatched input per tab before submitting', async () => {
    const user = userEvent.setup();
    const { Route } = await import('../routes/settings/workspace');
    const Component = (Route as any).component;

    render(
      <TooltipProvider delayDuration={0}>
        <Component />
      </TooltipProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Member' }));
    expect(
      await screen.findByText('Please enter a User ID')
    ).toBeInTheDocument();
    expect(inviteMutateAsync).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('User ID'), 'teammate@example.com');
    await user.click(screen.getByRole('button', { name: 'Add Member' }));

    expect(
      await screen.findByText(
        'This looks like an email address. Switch to the "By Email" tab to invite by email.'
      )
    ).toBeInTheDocument();
    expect(inviteMutateAsync).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: 'By Email' }));
    const emailInput = screen.getByLabelText('Email Address');
    await user.clear(emailInput);
    await user.type(emailInput, 'not-an-email@');
    await user.click(screen.getByRole('button', { name: 'Send Invite' }));

    expect(
      await screen.findByText('Please enter a valid email address')
    ).toBeInTheDocument();
    expect(inviteMutateAsync).not.toHaveBeenCalled();
  });

  test('shows SMTP warning notice and positioned tooltip in Email mode when SMTP is unavailable', async () => {
    const user = userEvent.setup();
    const { Route } = await import('../routes/settings/workspace');
    const Component = (Route as any).component;

    render(
      <TooltipProvider delayDuration={0}>
        <Component />
      </TooltipProvider>
    );

    await user.click(screen.getByRole('tab', { name: 'By Email' }));

    expect(
      screen.getByText('SMTP is not configured on this server')
    ).toBeInTheDocument();

    const warningTrigger = screen.getByRole('img', {
      name: 'SMTP service is not configured on the server, invitation emails will not be sent',
    });
    await user.hover(warningTrigger);

    await waitFor(() => {
      const tooltipWrapper = document.querySelector(
        '[data-radix-popper-content-wrapper]'
      );
      expect(tooltipWrapper).not.toBeNull();
      expect(tooltipWrapper).not.toHaveStyle('transform: translate(0, -200%)');
    });
  });
});
