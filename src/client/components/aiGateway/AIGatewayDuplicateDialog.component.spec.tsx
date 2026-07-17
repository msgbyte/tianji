import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AIGatewayDuplicateDialog } from './AIGatewayDuplicateDialog';

const mocks = vi.hoisted(() => ({
  duplicate: vi.fn(),
  refetchGateways: vi.fn(),
  navigate: vi.fn(),
  defaultErrorHandler: vi.fn(),
  mutationOptions: { current: null as any },
  isPending: false,
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: mocks.defaultErrorHandler,
  trpc: {
    useUtils: () => ({
      aiGateway: { all: { refetch: mocks.refetchGateways } },
    }),
    aiGateway: {
      duplicate: {
        useMutation: (options: unknown) => {
          mocks.mutationOptions.current = options;
          return {
            mutateAsync: mocks.duplicate,
            isPending: mocks.isPending,
          };
        },
      },
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isPending = false;
  mocks.mutationOptions.current = null;
  mocks.duplicate.mockResolvedValue({
    id: 'gateway_copy',
    name: 'Gateway Copy',
  });
  mocks.refetchGateways.mockResolvedValue(undefined);
});

describe('AIGatewayDuplicateDialog', () => {
  test('uses a default copy name and submits only safe fields', async () => {
    render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    const nameInput = screen.getByLabelText('AI Gateway Name');
    expect(nameInput).toHaveValue('Primary Gateway - Copy');

    fireEvent.change(nameInput, { target: { value: '  Gateway Copy  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate gateway' }));

    await waitFor(() => {
      expect(mocks.duplicate).toHaveBeenCalledWith({
        workspaceId: 'workspace_1',
        gatewayId: 'gateway_1',
        name: 'Gateway Copy',
      });
    });
    expect(JSON.stringify(mocks.duplicate.mock.calls)).not.toContain(
      'modelApiKey'
    );
    expect(mocks.mutationOptions.current.onError).toBe(
      mocks.defaultErrorHandler
    );
  });

  test('refreshes the list and navigates to the duplicate on success', async () => {
    render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate gateway' }));

    await waitFor(() => {
      expect(mocks.refetchGateways).toHaveBeenCalledWith({
        workspaceId: 'workspace_1',
      });
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: '/aiGateway/$gatewayId',
        params: { gatewayId: 'gateway_copy' },
      });
    });
    expect(
      screen.queryByRole('heading', { name: 'Duplicate AI Gateway' })
    ).not.toBeInTheDocument();
  });

  test('does not submit an empty name', () => {
    render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.change(screen.getByLabelText('AI Gateway Name'), {
      target: { value: '   ' },
    });

    expect(
      screen.getByRole('button', { name: 'Duplicate gateway' })
    ).toBeDisabled();
    expect(mocks.duplicate).not.toHaveBeenCalled();
  });

  test('keeps the default copy name within the server length limit', () => {
    render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName={'a'.repeat(100)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

    const defaultName = screen.getByLabelText('AI Gateway Name').getAttribute(
      'value'
    );
    expect(defaultName).toHaveLength(100);
    expect(defaultName).toMatch(/ - Copy$/);
  });

  test('prevents closing or resubmitting while pending', () => {
    const { rerender } = render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

    mocks.isPending = true;
    rerender(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Duplicate gateway' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByRole('heading', { name: 'Duplicate AI Gateway' })
    ).toBeInTheDocument();
  });

  test('keeps the dialog and entered name when duplication fails', async () => {
    mocks.duplicate.mockRejectedValue(new Error('database unavailable'));
    render(
      <AIGatewayDuplicateDialog
        gatewayId="gateway_1"
        gatewayName="Primary Gateway"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    const nameInput = screen.getByLabelText('AI Gateway Name');
    fireEvent.change(nameInput, { target: { value: 'Retry Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate gateway' }));

    await waitFor(() => expect(mocks.duplicate).toHaveBeenCalledOnce());
    expect(
      screen.getByRole('heading', { name: 'Duplicate AI Gateway' })
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue('Retry Name');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
