import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { AIGatewayPricingModal } from './AIGatewayPricingModal';

const mocks = vi.hoisted(() => ({
  modelPricing: vi.fn(() => ({
    data: {
      availableProviders: [
        { id: 'alpha', name: 'Alpha' },
        { id: 'beta', name: 'Beta' },
      ],
      providers: [],
    },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => key,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/api/trpc', () => ({
  trpc: { aiGateway: { modelPricing: { useQuery: mocks.modelPricing } } },
}));

test('selects and clears a provider while preserving the model search', async () => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  render(<AIGatewayPricingModal isOpen onClose={vi.fn()} />);

  const selector = screen.getByRole('combobox', { name: 'Provider' });
  expect(selector).toHaveTextContent('All providers');
  expect(mocks.modelPricing).toHaveBeenLastCalledWith(
    {
      workspaceId: 'workspace_1',
      search: undefined,
      providerId: undefined,
      limit: 50,
    },
    expect.any(Object)
  );

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'shared-model' },
  });
  await waitFor(() =>
    expect(mocks.modelPricing).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'shared-model' }),
      expect.any(Object)
    )
  );

  fireEvent.keyDown(selector, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Beta' }));
  expect(selector).toHaveTextContent('Beta');
  expect(mocks.modelPricing).toHaveBeenLastCalledWith(
    {
      workspaceId: 'workspace_1',
      search: 'shared-model',
      providerId: 'beta',
      limit: 50,
    },
    expect.any(Object)
  );

  fireEvent.keyDown(selector, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'All providers' }));
  expect(mocks.modelPricing).toHaveBeenLastCalledWith(
    {
      workspaceId: 'workspace_1',
      search: 'shared-model',
      providerId: undefined,
      limit: 50,
    },
    expect.any(Object)
  );
});
