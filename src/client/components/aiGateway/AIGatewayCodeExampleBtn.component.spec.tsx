import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AIGatewayCodeExampleBtn } from './AIGatewayCodeExampleBtn';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    aiGateway: {
      info: {
        useQuery: () => ({
          data: {
            id: 'gateway_1',
            name: 'Primary Gateway',
          },
        }),
      },
    },
  },
}));

vi.mock('../CodeExample', () => ({
  CodeExample: ({
    example,
  }: {
    example: Record<string, { code?: string; label: string }>;
  }) => (
    <pre data-testid="code-example">
      {Object.values(example)
        .map((item) => item.code)
        .join('\n')}
    </pre>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    Icon,
    ...props
  }: React.PropsWithChildren<{
    Icon?: React.ComponentType;
  }> &
    React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>
      {Icon ? <Icon /> : null}
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <p>{children}</p>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void;
  }>({});

  return {
    Select: ({
      children,
      onValueChange,
    }: React.PropsWithChildren<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>) => (
      <SelectContext.Provider value={{ onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectContent: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(SelectContext);

      return (
        <button
          type="button"
          onClick={() => context.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
    SelectTrigger: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    SelectValue: () => null,
  };
});

describe('AIGatewayCodeExampleBtn', () => {
  test('uses current OpenAI and Anthropic models in generated examples', () => {
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);

    expect(screen.getByTestId('code-example')).toHaveTextContent('gpt-5.5');

    fireEvent.click(screen.getByRole('button', { name: 'Anthropic API' }));

    expect(screen.getByTestId('code-example')).toHaveTextContent(
      'claude-opus-4-8'
    );
  });
});
