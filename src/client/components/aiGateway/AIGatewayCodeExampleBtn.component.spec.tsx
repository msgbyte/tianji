import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AIGatewayCodeExampleBtn } from './AIGatewayCodeExampleBtn';

const gateway = vi.hoisted(() => ({
  id: 'gateway_1',
  name: 'Primary Gateway',
  customModelName: '',
}));
beforeEach(() => {
  gateway.customModelName = '';
});

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
          data: gateway,
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
        <button type="button" onClick={() => context.onValueChange?.(value)}>
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
  test('lists Custom API after all built-in examples', () => {
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);

    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.textContent)
        .filter(Boolean)
    ).toEqual([
      'OpenAI API',
      'Deepseek API',
      'OpenRouter API',
      'Anthropic API',
      'Gemini CLI',
      'Gemini API',
      'Custom API',
    ]);
  });

  test('shows Gemini CLI setup at the unversioned custom root with a concrete model', () => {
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Gemini CLI' }));
    const code = screen.getByTestId('code-example');
    expect(code).toHaveTextContent(
      `GOOGLE_GEMINI_BASE_URL='${window.location.origin}/api/ai/workspace_1/gateway_1/custom'`
    );
    expect(code).toHaveTextContent("GEMINI_API_KEY='<YOUR_API_KEY>'");
    expect(code).toHaveTextContent("GEMINI_MODEL='gemini-3.8-flash'");
    expect(code).not.toHaveTextContent('/chat/completions');
    expect(
      screen.getByText(/Test Connection only checks OpenAI compatibility/)
    ).toBeInTheDocument();
  });

  test('uses the same concrete model for the native Gemini API example', () => {
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Gemini API' }));

    expect(screen.getByTestId('code-example')).toHaveTextContent(
      '/custom/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse'
    );
    expect(screen.getByTestId('code-example')).not.toHaveTextContent(
      '<UPSTREAM_MODEL_ID>'
    );
  });

  test('uses the configured alias in the native Gemini API example and warns about overrides', () => {
    gateway.customModelName = 'relay/gemini';
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Gemini API' }));
    expect(screen.getByTestId('code-example')).toHaveTextContent(
      '/custom/v1beta/models/relay/gemini:streamGenerateContent?alt=sse'
    );
    expect(screen.getByTestId('code-example')).toHaveTextContent(
      'x-goog-api-key: <YOUR_API_KEY>'
    );
    expect(
      screen.getByText(/overrides all requested models/)
    ).toBeInTheDocument();
  });

  test('quotes configured models in CLI setup and encodes them in API URLs', () => {
    gateway.customModelName = "relay/model's name?variant=1";
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Gemini CLI' }));

    expect(screen.getByTestId('code-example')).toHaveTextContent(
      "GEMINI_MODEL='relay/model'\\''s name?variant=1'"
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gemini API' }));

    expect(screen.getByTestId('code-example')).toHaveTextContent(
      "/custom/v1beta/models/relay/model'\\''s%20name%3Fvariant%3D1:streamGenerateContent?alt=sse"
    );
  });

  test('keeps other providers independent of the configured Gemini model', () => {
    gateway.customModelName = 'relay/gemini';
    render(<AIGatewayCodeExampleBtn gatewayId="gateway_1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Gemini CLI' }));
    expect(screen.getByTestId('code-example')).toHaveTextContent(
      "GEMINI_MODEL='relay/gemini'"
    );

    for (const [provider, model, endpoint] of [
      ['OpenAI API', 'gpt-5.5', '/openai/v1/chat/completions'],
      ['Deepseek API', 'deepseek-chat', '/deepseek/v1/chat/completions'],
      ['OpenRouter API', 'openai/gpt-5.5', '/openrouter/v1/chat/completions'],
      ['Anthropic API', 'claude-opus-4-8', '/anthropic/v1/messages'],
      ['Custom API', 'custom-model', '/custom/v1/chat/completions'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: provider }));

      const code = screen.getByTestId('code-example');
      expect(code).toHaveTextContent(model);
      expect(code).toHaveTextContent(endpoint);
      expect(code).not.toHaveTextContent('relay/gemini');
      expect(code).not.toHaveTextContent('/v1beta/models/');
      expect(code).not.toHaveTextContent('GEMINI_MODEL');
      expect(
        screen.queryByText(/overrides all requested models/)
      ).not.toBeInTheDocument();
    }
  });
});
