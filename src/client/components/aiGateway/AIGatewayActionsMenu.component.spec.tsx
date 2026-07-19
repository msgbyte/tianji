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
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/aiGateway/AIGatewayDuplicateDialog', () => ({
  AIGatewayDuplicateDialog: (props: unknown) => {
    mocks.duplicateDialogProps.current = props;
    return null;
  },
}));

vi.mock('@/components/AlertConfirm', () => ({
  AlertConfirm: ({
    children,
    onConfirm,
  }: React.PropsWithChildren<{ onConfirm: () => void }>) => (
    <div>
      {children}
      <button onClick={onConfirm}>Confirm delete</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onDelete.mockResolvedValue(undefined);
  mocks.duplicateDialogProps.current = null;
});

function renderMenu() {
  render(
    <AIGatewayActionsMenu
      gatewayId="gateway_1"
      gatewayName="Primary Gateway"
      onEdit={mocks.onEdit}
      onDelete={mocks.onDelete}
    />
  );
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'More' }));
}

describe('AIGatewayActionsMenu', () => {
  test('shows Edit, Duplicate, and Delete in order', async () => {
    renderMenu();
    await openMenu();

    const actions = ['Edit', 'Duplicate', 'Delete'].map((name) =>
      screen.getByText(name)
    );
    expect(actions[0].compareDocumentPosition(actions[1])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(actions[1].compareDocumentPosition(actions[2])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
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
});
