import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AIGatewayActionsMenu } from './AIGatewayActionsMenu';

const mocks = vi.hoisted(() => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  duplicateDialogProps: { current: null as any },
  useRealAlertConfirm: false,
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: React.forwardRef(
    (
      { children, to, params, ...props }: any,
      ref: React.ForwardedRef<HTMLAnchorElement>
    ) => (
      <a
        ref={ref}
        href={to.replace('$gatewayId', params.gatewayId)}
        {...props}
      >
        {children}
      </a>
    )
  ),
}));

vi.mock('@/components/aiGateway/AIGatewayDuplicateDialog', () => ({
  AIGatewayDuplicateDialog: (props: unknown) => {
    mocks.duplicateDialogProps.current = props;
    return null;
  },
}));

vi.mock('@/components/AlertConfirm', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/AlertConfirm')>();

  return {
    AlertConfirm: ({
      children,
      onConfirm,
      ...props
    }: React.ComponentProps<typeof actual.AlertConfirm>) => {
      if (mocks.useRealAlertConfirm) {
        return (
          <actual.AlertConfirm onConfirm={onConfirm} {...props}>
            {children}
          </actual.AlertConfirm>
        );
      }

      return (
        <div>
          {children}
          <button onClick={onConfirm}>Confirm delete</button>
        </div>
      );
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onDelete.mockResolvedValue(undefined);
  mocks.duplicateDialogProps.current = null;
  mocks.useRealAlertConfirm = false;
});

function renderMenu(canManage = true) {
  render(
    <AIGatewayActionsMenu
      gatewayId="gateway_1"
      gatewayName="Primary Gateway"
      canManage={canManage}
      onEdit={mocks.onEdit}
      onDelete={mocks.onDelete}
    />
  );
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'More' }));
}

describe('AIGatewayActionsMenu', () => {
  test('shows Log Observer before the management actions', async () => {
    renderMenu();
    await openMenu();

    const actions = ['Log Observer', 'Edit', 'Duplicate', 'Delete'].map((name) =>
      screen.getByText(name)
    );
    expect(screen.getByRole('menuitem', { name: 'Log Observer' })).toHaveAttribute(
      'href',
      '/aiGateway/gateway_1/observer'
    );
    expect(actions[0].compareDocumentPosition(actions[1])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(actions[1].compareDocumentPosition(actions[2])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(actions[2].compareDocumentPosition(actions[3])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test('shows only Log Observer to users without management permission', async () => {
    renderMenu(false);
    await openMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Log Observer' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('invokes edit from the menu', async () => {
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByText('Edit'));

    expect(mocks.onEdit).toHaveBeenCalledOnce();
  });

  test('opens the controlled duplicate dialog from the menu', async () => {
    renderMenu();
    expect(mocks.duplicateDialogProps.current).toMatchObject({
      gatewayId: 'gateway_1',
      gatewayName: 'Primary Gateway',
      open: false,
    });

    await openMenu();
    await userEvent.click(screen.getByText('Duplicate'));

    expect(mocks.duplicateDialogProps.current).toMatchObject({ open: true });
  });

  test('deletes only after confirmation', async () => {
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByText('Delete'));
    expect(mocks.onDelete).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm delete' })
    );
    expect(mocks.onDelete).toHaveBeenCalledOnce();
  });

  test('opens the real delete confirmation before deleting', async () => {
    mocks.useRealAlertConfirm = true;
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByText('Delete'));

    expect(
      await screen.findByRole('alertdialog', {
        name: 'Delete AI Gateway Primary Gateway',
      })
    ).toBeInTheDocument();
    expect(mocks.onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(mocks.onDelete).toHaveBeenCalledOnce();
  });
});
