import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AIRouterRouteEditor } from './AIRouterRouteEditor';

const replaceTiersMutateAsync = vi.hoisted(() => vi.fn());

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/hooks/useEvent', () => ({
  useEvent: <T extends (...args: any[]) => any>(fn: T) => fn,
}));

vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: vi.fn(),
  trpc: {
    useUtils: () => ({
      aiRouter: {
        info: { invalidate: vi.fn() },
        all: { invalidate: vi.fn() },
      },
    }),
    aiRouter: {
      compatibleGateways: {
        useQuery: () => ({
          data: [
            {
              id: 'gateway_1',
              name: 'Primary Gateway',
              modelProvider: null,
            },
          ],
          isLoading: false,
        }),
      },
      replaceTiers: {
        useMutation: () => ({
          mutateAsync: replaceTiersMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({
    children,
    onDragEnd,
  }: React.PropsWithChildren<{
    onDragEnd: (result: {
      source: { index: number };
      destination: { index: number };
    }) => void;
  }>) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onDragEnd({
            source: { index: 0 },
            destination: { index: 1 },
          })
        }
      >
        Simulate tier drag
      </button>
      {children}
    </div>
  ),
  Draggable: ({
    children,
  }: {
    children: (
      provided: {
        innerRef: React.Ref<HTMLDivElement>;
        draggableProps: Record<string, unknown>;
        dragHandleProps: Record<string, unknown>;
      },
      snapshot: {
        isDragging: boolean;
      }
    ) => React.ReactNode;
  }) =>
    children(
      {
        innerRef: vi.fn(),
        draggableProps: {},
        dragHandleProps: {},
      },
      {
        isDragging: false,
      }
    ),
}));

vi.mock('@/components/Sortable/StrictModeDroppable', () => ({
  StrictModeDroppable: ({
    children,
  }: {
    children: (provided: {
      innerRef: React.Ref<HTMLDivElement>;
      droppableProps: Record<string, unknown>;
      placeholder: React.ReactNode;
    }) => React.ReactNode;
  }) =>
    children({
      innerRef: vi.fn(),
      droppableProps: {},
      placeholder: null,
    }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    Icon,
    loading: _loading,
    variant: _variant,
    size: _size,
    ...props
  }: React.PropsWithChildren<{
    Icon?: React.ComponentType;
    loading?: boolean;
    variant?: string;
    size?: string;
  }> &
    React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>
      {Icon ? <Icon /> : null}
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children,
  }: React.PropsWithChildren<{ open?: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({
    onCheckedChange,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      {...props}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

vi.mock('antd', () => {
  const AntdSelectContext = React.createContext<{
    value: Array<number | string>;
    onChange?: (value: Array<number | string>) => void;
  }>({
    value: [],
  });

  const Select = ({
    children,
    id,
    mode,
    optionFilterProp,
    placeholder,
    value,
    onChange,
  }: React.PropsWithChildren<{
    id?: string;
    mode?: string;
    optionFilterProp?: string;
    placeholder?: string;
    value?: Array<number | string>;
    onChange?: (value: Array<number | string>) => void;
  }>) => (
    <AntdSelectContext.Provider value={{ value: value ?? [], onChange }}>
      <div
        data-testid={`antd-select-${id ?? 'select'}`}
        data-mode={mode}
        data-option-filter-prop={optionFilterProp}
        data-value={(value ?? []).join(',')}
      >
        <span>{placeholder}</span>
        {children}
      </div>
    </AntdSelectContext.Provider>
  );

  Select.Option = ({
    children,
    value,
  }: React.PropsWithChildren<{ value: number | string }>) => {
    const context = React.useContext(AntdSelectContext);
    const selected = context.value.includes(value);

    return (
      <button
        aria-selected={selected}
        role="option"
        type="button"
        onClick={() =>
          context.onChange?.(
            selected
              ? context.value.filter((item) => item !== value)
              : [...context.value, value]
          )
        }
      >
        {children}
      </button>
    );
  };

  Select.OptGroup = ({
    children,
    label,
  }: React.PropsWithChildren<{ label: string }>) => (
    <div aria-label={label} role="group">
      {children}
    </div>
  );

  const Tag = ({ children }: React.PropsWithChildren<{ color?: string }>) => (
    <span>{children}</span>
  );

  return { Select, Tag };
});

vi.mock('@/components/ui/select', () => {
  const SelectValueChangeContext = React.createContext<(value: string) => void>(
    () => {}
  );

  return {
    Select: ({
      children,
      onValueChange,
    }: React.PropsWithChildren<{ onValueChange?: (value: string) => void }>) => (
      <SelectValueChangeContext.Provider value={onValueChange ?? (() => {})}>
        <div>{children}</div>
      </SelectValueChangeContext.Provider>
    ),
    SelectContent: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: React.PropsWithChildren<{ value: string }>) => {
      const onValueChange = React.useContext(SelectValueChangeContext);

      return (
        <button
          data-value={value}
          role="option"
          type="button"
          onClick={() => onValueChange(value)}
        >
          {children}
        </button>
      );
    },
    SelectTrigger: ({ children }: React.PropsWithChildren) => (
      <button type="button">{children}</button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
  };
});

afterEach(() => {
  replaceTiersMutateAsync.mockReset();
  cleanup();
});

describe('AIRouterRouteEditor', () => {
  test('uses one protocol-agnostic gateway route editor', () => {
    render(<AIRouterRouteEditor routerId="router_1" tiers={[]} />);

    expect(screen.queryByText('OpenAI Chat Completions')).toBeNull();
    expect(screen.queryByText('Anthropic Messages')).toBeNull();
    expect(screen.getByText('Tier 1')).toBeInTheDocument();

    const addGatewayButtons = screen.getAllByRole('button', {
      name: /Add Gateway/,
    });
    expect(addGatewayButtons).toHaveLength(1);

    fireEvent.click(addGatewayButtons[0]);

    expect(
      screen.getByRole('button', { name: 'Select gateway' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Gateway' })).toBeNull();
    expect(
      screen.getByRole('option', { name: 'Primary Gateway' })
    ).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
  });

  test('adds a gateway route with the selected provider stored on the node', () => {
    replaceTiersMutateAsync.mockResolvedValue(undefined);

    render(<AIRouterRouteEditor routerId="router_1" tiers={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /Add Gateway/ }));

    expect(screen.queryByText('Provider')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Primary Gateway' }));

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'OpenAI' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'OpenRouter' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'OpenRouter' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: /Add Gateway/ }).at(-1)!
    );

    expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      tiers: [
        {
          order: 0,
          nodes: [
            {
              gatewayId: 'gateway_1',
              provider: 'openrouter',
              order: 0,
              enabled: true,
              weight: 100,
              modelOverride: null,
              timeoutMs: 30000,
              retryableStatusCodes: [429, 500, 502, 503, 504],
            },
          ],
        },
      ],
    });
  });

  test('uses a built-in multiple select for retryable status codes', () => {
    replaceTiersMutateAsync.mockResolvedValue(undefined);

    render(<AIRouterRouteEditor routerId="router_1" tiers={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /Add Gateway/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Primary Gateway' }));

    expect(
      screen.getByTestId('antd-select-retryableStatusCodes')
    ).toHaveAttribute('data-mode', 'multiple');
    expect(
      screen.getByTestId('antd-select-retryableStatusCodes')
    ).toHaveAttribute('data-option-filter-prop', 'children');
    expect(screen.queryByPlaceholderText('429,500,502,503,504')).toBeNull();

    fireEvent.click(
      screen.getByRole('option', { name: '500 - Internal Server Error' })
    );
    fireEvent.click(
      screen.getByRole('option', { name: '408 - Request Timeout' })
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: /Add Gateway/ }).at(-1)!
    );

    expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      tiers: [
        {
          order: 0,
          nodes: [
            {
              gatewayId: 'gateway_1',
              provider: 'openai',
              order: 0,
              enabled: true,
              weight: 100,
              modelOverride: null,
              timeoutMs: 30000,
              retryableStatusCodes: [429, 502, 503, 504, 408],
            },
          ],
        },
      ],
    });
  });

  test('edits an existing gateway route instead of appending a new one', () => {
    replaceTiersMutateAsync.mockResolvedValue(undefined);

    render(
      <AIRouterRouteEditor
        routerId="router_1"
        tiers={
          [
            {
              id: 'tier_1',
              order: 0,
              nodes: [
                {
                  gatewayId: 'gateway_1',
                  provider: 'openrouter',
                  order: 0,
                  enabled: true,
                  weight: 20,
                  modelOverride: 'old-model',
                  timeoutMs: 30000,
                  retryableStatusCodes: [429, 500],
                  gateway: {
                    name: 'Primary Gateway',
                  },
                },
              ],
            },
          ] as any
        }
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit route' }));

    expect(
      screen.getByRole('heading', { name: 'Edit Gateway Route' })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Weight'), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByPlaceholderText('Use request model'), {
      target: { value: 'new-model' },
    });
    fireEvent.click(
      screen.getByRole('option', { name: '500 - Internal Server Error' })
    );
    fireEvent.click(
      screen.getByRole('option', { name: '408 - Request Timeout' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Gateway' }));

    expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      tiers: [
        {
          order: 0,
          nodes: [
            {
              gatewayId: 'gateway_1',
              provider: 'openrouter',
              order: 0,
              enabled: true,
              weight: 35,
              modelOverride: 'new-model',
              timeoutMs: 30000,
              retryableStatusCodes: [429, 408],
            },
          ],
        },
      ],
    });
  });

  test('places add tier action below the tier list and left aligned', () => {
    render(<AIRouterRouteEditor routerId="router_1" tiers={[]} />);

    const tierHeading = screen.getByRole('heading', { name: 'Tier 1' });
    const addTierButton = screen.getByRole('button', { name: 'Add Tier' });

    expect(
      Boolean(
        tierHeading.compareDocumentPosition(addTierButton) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    expect(addTierButton.parentElement).toHaveClass('justify-start');
  });

  test('uses drag handles without tier up and down arrow controls', () => {
    render(
      <AIRouterRouteEditor
        routerId="router_1"
        tiers={
          [
            {
              id: 'tier_1',
              order: 0,
              nodes: [],
            },
            {
              id: 'tier_2',
              order: 1,
              nodes: [],
            },
          ] as any
        }
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Move tier up' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move tier down' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Drag tier' })).toHaveLength(
      2
    );
  });

  test('reorders tiers by drag and persists the new tier order', () => {
    replaceTiersMutateAsync.mockResolvedValue(undefined);

    render(
      <AIRouterRouteEditor
        routerId="router_1"
        tiers={
          [
            {
              id: 'tier_1',
              order: 0,
              nodes: [
                {
                  gatewayId: 'gateway_1',
                  order: 0,
                  enabled: true,
                  weight: 100,
                  modelOverride: null,
                  timeoutMs: 30000,
                  retryableStatusCodes: [],
                },
              ],
            },
            {
              id: 'tier_2',
              order: 1,
              nodes: [],
            },
          ] as any
        }
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Simulate tier drag' }));

    expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      routerId: 'router_1',
      tiers: [
        {
          order: 0,
          nodes: [],
        },
        {
          order: 1,
          nodes: [
            {
              gatewayId: 'gateway_1',
              provider: 'openai',
              order: 0,
              enabled: true,
              weight: 100,
              modelOverride: null,
              timeoutMs: 30000,
              retryableStatusCodes: [],
            },
          ],
        },
      ],
    });
  });
});
