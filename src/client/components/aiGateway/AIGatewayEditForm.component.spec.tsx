import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import {
  AIGatewayEditForm,
  type AIGatewayEditFormValues,
} from './AIGatewayEditForm';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement> & { optional?: boolean }
  >(({ optional: _optional, ...props }, ref) => <label ref={ref} {...props} />),
}));

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  CollapsibleContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('./AIGatewayStrategyEditor', () => ({
  AIGatewayStrategyEditor: () => null,
}));

const defaultValues: AIGatewayEditFormValues = {
  name: 'Gateway',
  modelApiKey: 'sk-existing',
  customModelBaseUrl: 'https://old.example.com/v1',
  customModelName: 'old-model',
  customModelStrategy: '',
  customModelInputPrice: null,
  customModelOutputPrice: null,
};

describe('AIGatewayEditForm connection test action', () => {
  test('omits the action when no test callback is supplied', () => {
    render(
      <AIGatewayEditForm defaultValues={defaultValues} onSubmit={vi.fn()} />
    );

    expect(
      screen.queryByRole('button', { name: 'Test Connection' })
    ).not.toBeInTheDocument();
  });

  test('passes current unsaved values without submitting or resetting', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const onTestConnection = vi.fn();
    render(
      <AIGatewayEditForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onTestConnection={onTestConnection}
      />
    );

    fireEvent.change(screen.getByLabelText(/Model API Key/), {
      target: { value: 'sk-current' },
    });
    fireEvent.change(screen.getByLabelText(/Custom Model Base URL/), {
      target: { value: 'https://current.example.com/v1' },
    });
    fireEvent.change(screen.getByLabelText(/Custom Model Name/), {
      target: { value: 'current-model' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));

    await waitFor(() => {
      expect(onTestConnection).toHaveBeenCalledWith({
        ...defaultValues,
        modelApiKey: 'sk-current',
        customModelBaseUrl: 'https://current.example.com/v1',
        customModelName: 'current-model',
      });
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('current-model')).toBeInTheDocument();
  });

  test('requires an API key before invoking the test callback', async () => {
    const onTestConnection = vi.fn();
    render(
      <AIGatewayEditForm
        defaultValues={{ ...defaultValues, modelApiKey: '' }}
        onSubmit={vi.fn(async () => undefined)}
        onTestConnection={onTestConnection}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));

    expect(
      await screen.findByText('Model API Key is required')
    ).toBeInTheDocument();
    expect(onTestConnection).not.toHaveBeenCalled();
  });

  test('disables the action while the connection test is pending', () => {
    render(
      <AIGatewayEditForm
        defaultValues={defaultValues}
        onSubmit={vi.fn(async () => undefined)}
        onTestConnection={vi.fn()}
        isTestingConnection={true}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Test Connection' })
    ).toBeDisabled();
  });
});
