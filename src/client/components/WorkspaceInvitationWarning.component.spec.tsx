import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    (options: Record<string, unknown>) => ({
      ...options,
    }),
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  const useMutation = () => ({ mutateAsync: vi.fn() });

  return {
    defaultErrorHandler: vi.fn(),
    defaultSuccessHandler: vi.fn(),
    trpc: {
      useUtils: () => ({
        workspace: { members: { invalidate: vi.fn() } },
      }),
      workspace: {
        invite: { useMutation },
        rename: { useMutation },
        delete: { useMutation },
        updateSettings: { useMutation },
        recheckPauseStatus: { useMutation },
      },
    },
  };
});

vi.mock('@/components/workspace/useWorkspaceMembers', () => ({
  useWorkspaceMembers: () => ({ tableEl: null }),
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

describe('Workspace invitation warning', () => {
  test('positions the SMTP warning tooltip at its trigger', async () => {
    const user = userEvent.setup();
    const { Route } = await import('../routes/settings/workspace');
    const Component = (Route as any).component;
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <Component />
      </TooltipProvider>
    );
    const inviteHeading = screen.getByText(
      'Invite new members by email address'
    );
    const warningIcon = inviteHeading.parentElement?.querySelector('svg');

    expect(warningIcon).not.toBeNull();
    await user.hover(warningIcon!);

    await waitFor(() => {
      const tooltipWrapper = document.querySelector(
        '[data-radix-popper-content-wrapper]'
      );
      expect(tooltipWrapper).not.toHaveStyle('transform: translate(0, -200%)');
    });
  });
});
