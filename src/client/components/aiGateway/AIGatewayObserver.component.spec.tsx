import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { AIGatewayObserver } from './AIGatewayObserver';

const mocks = vi.hoisted(() => ({
  data: undefined as { items: any[]; nextCursor?: string } | undefined,
  input: undefined as Record<string, unknown> | undefined,
  t: vi.fn((key: string, values?: Record<string, unknown>) => {
    if (key === 'Gateway Log Observer') return 'Translated Gateway Observer';
    return key.replace(/\{\{(\w+)\}\}/g, (_, name) =>
      String(values?.[name] ?? '')
    );
  }),
}));

const style = document.createElement('style');

beforeAll(() => {
  style.textContent = readFileSync(
    resolve(process.cwd(), 'components/aiGateway/AIGatewayObserver.css'),
    'utf8'
  );
  document.head.append(style);
});

afterAll(() => style.remove());

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('@i18next-toolkit/react', () => ({
  t: mocks.t,
}));

vi.mock('@/hooks/useWindowSize', () => ({
  useWindowSize: () => ({ width: 1440, height: 900 }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: () => <div />,
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    aiGateway: {
      all: {
        useQuery: () => ({ data: [{ id: 'gateway_1', name: 'Primary' }] }),
      },
      logs: {
        useQuery: (input: Record<string, unknown>) => {
          mocks.input = input;
          return {
            data: mocks.data,
            error: null,
            isLoading: !mocks.data,
            isFetching: false,
          };
        },
      },
    },
  },
}));

beforeEach(() => {
  localStorage.clear();
  mocks.data = undefined;
  mocks.input = undefined;
  mocks.t.mockClear();
});

test('renders observer copy in English through the translation function', () => {
  render(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(screen.getByText('Translated Gateway Observer')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
});

test('uses the shared non-native gateway selector', () => {
  render(<AIGatewayObserver gatewayId="gateway_1" />);

  const selector = screen.getByRole('combobox', { name: 'Select Gateway' });

  expect(selector).toHaveTextContent('Primary');
  expect(selector).not.toBeInstanceOf(HTMLSelectElement);
});

test('totals displayed usage across updates, filters, and clearing the view', () => {
  mocks.data = {
    items: [
      createLog('log_first', 'Primera solicitud', {
        inputToken: 1200,
        outputToken: 30,
        price: 0.00123,
      }),
      createLog('log_failed', 'Solicitud fallida', {
        status: 'Failed',
        inputToken: 200,
        outputToken: 4,
        price: 0.0001,
      }),
      createLog('log_pending', 'Solicitud en curso', {
        status: 'Pending',
        inputToken: 0,
        outputToken: 0,
        price: 0,
      }),
    ],
  };
  const { container, rerender } = render(
    <AIGatewayObserver gatewayId="gateway_1" />
  );
  const footer = within(container.querySelector('footer')!);
  const expectTotals = (cost: string, input: string, output: string) => {
    expect(footer.getByText('Total cost').querySelector('b')?.textContent).toBe(
      `$${cost}`
    );
    expect(
      footer.getByText('Total input tokens').querySelector('b')?.textContent
    ).toBe(input);
    expect(
      footer.getByText('Total output tokens').querySelector('b')?.textContent
    ).toBe(output);
  };
  expectTotals('0.00133', '1,400', '34');

  mocks.data = {
    items: [
      createLog('log_pending', 'Solicitud en curso', {
        inputToken: 300,
        outputToken: 6,
        price: 0.00067,
      }),
    ],
  };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);
  expectTotals('0.00200', '1,700', '40');

  fireEvent.click(screen.getByRole('button', { name: 'Failed' }));
  expectTotals('0.00010', '200', '4');
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  const search = screen.getByRole('textbox', { name: 'Search logs' });
  fireEvent.change(search, { target: { value: 'Primera' } });
  expectTotals('0.00123', '1,200', '30');
  fireEvent.change(search, { target: { value: 'no-match' } });
  expectTotals('0.00000', '0', '0');
  fireEvent.change(search, { target: { value: '' } });
  expectTotals('0.00200', '1,700', '40');

  fireEvent.click(screen.getByRole('button', { name: 'Clear current view' }));
  expectTotals('0.00000', '0', '0');
});

test('shows request timing in a collapsible timeline linked to selection and filters', () => {
  mocks.data = {
    items: [
      createLog('log_first', 'Primera solicitud', {
        modelName: 'model-first',
        createdAt: '2026-09-03T08:00:00.000Z',
        duration: 2000,
      }),
      createLog('log_second', 'Segunda solicitud', {
        modelName: 'model-second',
        createdAt: '2026-09-03T08:00:01.000Z',
        duration: 500,
        status: 'Failed',
      }),
    ],
  };
  render(<AIGatewayObserver gatewayId="gateway_1" />);

  const timeline = screen.getByRole('region', { name: 'Timeline' });
  const bars = timeline.querySelectorAll('.waterfall-item-bar');
  expect(bars[0]).toHaveStyle({ left: '0%', width: '100%' });
  expect(bars[1]).toHaveStyle({ left: '50%', width: '25%' });

  fireEvent.click(bars[0]);
  expect(screen.getByRole('heading', { name: 'model-first' })).toBeVisible();
  fireEvent.click(within(timeline).getByText('model-second · log_second'));
  expect(screen.getByRole('heading', { name: 'model-second' })).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
  expect(screen.getByRole('button', { name: 'Timeline' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  expect(screen.queryByRole('region', { name: 'Timeline' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));

  fireEvent.click(screen.getByRole('button', { name: 'Failed' }));
  const filteredTimeline = screen.getByRole('region', { name: 'Timeline' });
  expect(filteredTimeline.querySelectorAll('.waterfall-item-bar')).toHaveLength(
    1
  );
  expect(
    within(filteredTimeline).queryByText('model-first · log_first')
  ).toBeNull();

  fireEvent.change(screen.getByRole('textbox', { name: 'Search logs' }), {
    target: { value: 'no-match' },
  });
  expect(
    within(filteredTimeline).getByText('No requests to display')
  ).toBeVisible();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search logs' }), {
    target: { value: '' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Clear current view' }));
  expect(
    within(filteredTimeline).getByText('No requests to display')
  ).toBeVisible();
});

test('updates an in-progress timeline bar when the request finishes', () => {
  mocks.data = {
    items: [
      createLog('log_pending', 'Solicitud en curso', { status: 'Pending' }),
    ],
  };
  const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);
  const timeline = screen.getByRole('region', { name: 'Timeline' });
  expect(timeline.querySelector('.waterfall-item-bar')).toHaveClass('dashed');

  mocks.data = {
    items: [createLog('log_pending', 'Solicitud en curso', { duration: 2500 })],
  };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);
  expect(timeline.querySelectorAll('.waterfall-item-bar')).toHaveLength(1);
  expect(timeline.querySelector('.waterfall-item-bar')).not.toHaveClass(
    'dashed'
  );
});

test('applies custom latency boundaries and remembers them for each gateway', () => {
  mocks.data = {
    items: [29990, 30000, 60490, 60500].map((duration) =>
      createLog(`log_${duration}`, `Solicitud ${duration}`, { duration })
    ),
  };
  const { unmount } = render(<AIGatewayObserver gatewayId="gateway_1" />);
  expect(screen.getByRole('cell', { name: '30.00s' })).toHaveClass('is-error');

  fireEvent.click(screen.getByRole('button', { name: 'Latency thresholds' }));
  fireEvent.change(screen.getByLabelText('Yellow at (seconds)'), {
    target: { value: '30' },
  });
  fireEvent.change(screen.getByLabelText('Red at (seconds)'), {
    target: { value: '60.5' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByRole('cell', { name: '30.00s' })).toHaveClass('is-warn');
  const cells = document.querySelectorAll(
    '.observer-table tbody tr td:nth-child(2)'
  );
  expect(Array.from(cells, (cell) => cell.className)).toEqual([
    'is-error',
    'is-warn',
    'is-warn',
    '',
  ]);
  unmount();

  const restored = render(<AIGatewayObserver gatewayId="gateway_1" />);
  expect(screen.getByRole('cell', { name: '30.00s' })).toHaveClass('is-warn');
  fireEvent.click(screen.getByRole('button', { name: 'Latency thresholds' }));
  expect(screen.getByLabelText('Red at (seconds)')).toHaveValue(60.5);
  restored.unmount();

  mocks.data = {
    items: [
      createLog('log_other', 'Otra puerta', {
        gatewayId: 'gateway_2',
        duration: 30000,
      }),
    ],
  };
  render(<AIGatewayObserver gatewayId="gateway_2" />);
  expect(screen.getByRole('cell', { name: '30.00s' })).toHaveClass('is-error');
});

test.each([
  ['', '60'],
  ['0', '60'],
  ['-1', '60'],
  ['60', '30'],
  ['30', '30'],
  ['30', '1e309'],
])('rejects invalid latency thresholds (%s, %s)', (warning, error) => {
  mocks.data = { items: [createLog('log_1', 'Solicitud', { duration: 8000 })] };
  render(<AIGatewayObserver gatewayId="gateway_1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Latency thresholds' }));
  fireEvent.change(screen.getByLabelText('Yellow at (seconds)'), {
    target: { value: warning },
  });
  fireEvent.change(screen.getByLabelText('Red at (seconds)'), {
    target: { value: error },
  });
  fireEvent.submit(screen.getByRole('form', { name: 'Latency thresholds' }));

  expect(screen.getByRole('alert')).toBeVisible();
  expect(screen.getByRole('cell', { name: '8.00s' })).toHaveClass('is-error');
  expect(localStorage.length).toBe(0);
});

test('uses default latency thresholds when stored values are invalid', () => {
  localStorage.setItem(
    'tianji-observer-latency-workspace_1-gateway_1',
    JSON.stringify({ warning: 60, error: 30 })
  );
  mocks.data = {
    items: [createLog('log_1', 'Solicitud', { duration: 4000 })],
  };
  render(<AIGatewayObserver gatewayId="gateway_1" />);
  expect(screen.getByRole('cell', { name: '4.00s' })).toHaveClass('is-warn');
  fireEvent.click(screen.getByRole('button', { name: 'Latency thresholds' }));
  expect(screen.getByLabelText('Yellow at (seconds)')).toHaveValue(4);
});

test('keeps a request that arrives while the first response is delayed', () => {
  const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);

  mocks.data = { items: [createLog('log_1', 'Arrived while opening')] };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(screen.getAllByText('Arrived while opening')).not.toHaveLength(0);
  expect(mocks.input?.openedAt).toBeInstanceOf(Date);
});

test('accumulates logs while draining batches larger than 100', () => {
  const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);
  const firstBatch = Array.from({ length: 100 }, (_, index) =>
    createLog(`log_${index}`, `Request ${index}`)
  );

  mocks.data = { items: firstBatch, nextCursor: 'log_100' };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(mocks.input?.cursor).toBe('log_100');

  mocks.data = { items: [createLog('log_100', 'Request 100')] };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(screen.getAllByText('Request 0')).not.toHaveLength(0);
  expect(screen.getAllByText('Request 100')).not.toHaveLength(0);
  expect(screen.getByText('101 requests')).toBeInTheDocument();
});

test('replaces a pending row with its completed version', () => {
  const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);

  mocks.data = {
    items: [createLog('log_pending', 'Slow request', { status: 'Pending' })],
  };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);
  expect(
    screen.getByText('Streaming response in progress…')
  ).toBeInTheDocument();

  mocks.data = {
    items: [createLog('log_pending', 'Slow request', { status: 'Success' })],
  };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(
    screen.queryByText('Streaming response in progress…')
  ).not.toBeInTheDocument();
  expect(screen.getAllByText('Success')).not.toHaveLength(0);
});

test.each(['Success', 'Failed'])(
  'keeps a %s row stable when cached responses replay',
  (status) => {
    const pending = createLog('log_cached', 'Solicitud de prueba', {
      status: 'Pending',
      duration: 0,
      updatedAt: '2026-09-03T08:00:01Z',
    });
    mocks.data = { items: [pending] };
    const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);
    expect(mocks.input?.pendingIds).toEqual(['log_cached']);

    const completed = {
      ...pending,
      status,
      duration: 2500,
      updatedAt: '2026-09-03T08:00:02Z',
    };
    mocks.data = { items: [completed] };
    rerender(<AIGatewayObserver gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('button', { name: status }));
    const row = screen.getByRole('row', { name: /Solicitud de prueba/ });

    for (const stale of [
      pending,
      { ...pending, updatedAt: completed.updatedAt },
      { ...completed, duration: 1000, updatedAt: pending.updatedAt },
    ]) {
      mocks.data = { items: [stale] };
      rerender(<AIGatewayObserver gatewayId="gateway_1" />);

      expect(row).toBeInTheDocument();
      expect(within(row).getByText('2.50s')).toBeInTheDocument();
      expect(mocks.input?.pendingIds).toEqual([]);
    }

    mocks.data = {
      items: [
        { ...completed, duration: 3000, updatedAt: '2026-09-03T08:00:03Z' },
      ],
    };
    rerender(<AIGatewayObserver gatewayId="gateway_1" />);
    expect(within(row).getByText('3.00s')).toBeInTheDocument();
  }
);

test('keeps long message content inside a scrollable height limit', async () => {
  mocks.data = {
    items: [createLog('log_long', 'Contenido extenso para revisar')],
  };
  render(<AIGatewayObserver gatewayId="gateway_1" />);

  const bubble = (
    await screen.findByText('Contenido extenso para revisar', {
      selector: '.markdown-body p',
    })
  ).closest('.observer-bubble');
  const styles = window.getComputedStyle(bubble!);

  expect(styles.maxHeight).toBe('520px');
  expect(styles.overflow).toBe('auto');
});

test('renders conversation message content as Markdown', async () => {
  mocks.data = {
    items: [
      createLog('log_markdown', '## Título\n\nTexto **importante**', {
        responsePayload: { content: 'Respuesta sencilla' },
      }),
    ],
  };
  render(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(
    await screen.findByRole('heading', { name: 'Título' })
  ).toBeInTheDocument();
  expect(screen.getByText('importante').tagName).toBe('STRONG');
});

test.each(['Conversation', 'Input'])(
  'renders ordered reference images and opens the selected preview in %s',
  async (tab) => {
    mocks.data = {
      items: [
        createLog('log_images', '', {
          requestPayload: {
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Primera referencia' },
                  {
                    type: 'image_url',
                    image_url: { url: 'https://example.com/primera.png' },
                  },
                  { type: 'text', text: '```txt\nDetalles' },
                  { type: 'text', text: 'de la referencia\n```' },
                  {
                    type: 'image_url',
                    image_url: { url: 'https://example.com/segunda.png' },
                  },
                ],
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: 'https://example.com/tercera.png' },
                  },
                ],
              },
            ],
          },
        }),
      ],
    };
    render(<AIGatewayObserver gatewayId="gateway_1" />);
    fireEvent.click(screen.getByRole('tab', { name: tab }));

    const images = screen.getAllByRole('img', { name: 'Message attachment' });
    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      'https://example.com/primera.png',
      'https://example.com/segunda.png',
      'https://example.com/tercera.png',
    ]);
    const before = await screen.findByText('Primera referencia', {
      selector: '.observer-bubble *',
    });
    const between = await screen.findByText(/Detalles.*de la referencia/, {
      selector: tab === 'Conversation' ? 'pre code' : '.observer-bubble *',
    });
    for (const [first, second] of [
      [before, images[0]],
      [images[0], between],
      [between, images[1]],
    ]) {
      expect(first.compareDocumentPosition(second)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    }

    fireEvent.click(images[1].closest('button')!);
    const preview = screen.getByRole('dialog', { name: 'Message attachment' });
    expect(preview.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      'https://example.com/segunda.png'
    );
    fireEvent.keyDown(preview, { key: 'Escape' });
  }
);

test('renders Anthropic server tools and structured tool results', () => {
  const { rerender } = render(<AIGatewayObserver gatewayId="gateway_1" />);

  mocks.data = {
    items: [
      createLog('log_anthropic', 'Anthropic request', {
        modelProvider: 'anthropic',
        requestPayload: {
          messages: [
            { role: 'user', content: 'Search the weather' },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'srvtoolu_1',
                  content: [{ type: 'json', json: { temperature: 27 } }],
                },
              ],
            },
          ],
        },
        responsePayload: {
          response: {
            role: 'assistant',
            content: [
              {
                type: 'server_tool_use',
                id: 'srvtoolu_1',
                name: 'web_search',
                input: { query: 'Shanghai weather' },
              },
            ],
          },
        },
      }),
    ],
  };
  rerender(<AIGatewayObserver gatewayId="gateway_1" />);

  expect(screen.getByText('web_search')).toBeInTheDocument();
  expect(screen.getByText('Result')).toBeInTheDocument();
  expect(screen.getByText('"temperature"')).toBeInTheDocument();
  expect(screen.getByText('27')).toBeInTheDocument();
});

test('shows JSON item counts only while a branch is collapsed', () => {
  mocks.data = { items: [createLog('log_json', 'Inspect JSON')] };
  render(<AIGatewayObserver gatewayId="gateway_1" />);
  fireEvent.click(screen.getByRole('tab', { name: 'Raw' }));

  const requestViewer = screen.getByText('Request payload').closest('details');
  const branch =
    requestViewer?.querySelector<HTMLDetailsElement>('.json-branch');
  const count = branch?.querySelector('summary em');

  expect(branch).toHaveAttribute('open');
  expect(count).not.toBeVisible();

  fireEvent.click(branch!.querySelector('summary')!);
  expect(branch).not.toHaveAttribute('open');
  expect(count).toBeVisible();
});

function createLog(
  id: string,
  prompt: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    id,
    workspaceId: 'workspace_1',
    gatewayId: 'gateway_1',
    modelName: 'gpt-5',
    modelProvider: 'openai',
    userId: 'user_1',
    status: 'Success',
    duration: 1250,
    inputToken: 28,
    outputToken: 9,
    cacheReadInputToken: 0,
    cacheWriteInputToken: 0,
    ttft: 320,
    tpot: 38,
    price: 0.0012,
    stream: true,
    createdAt: new Date('2026-09-03T08:00:00Z'),
    updatedAt: new Date('2026-09-03T08:00:01Z'),
    requestPayload: { messages: [{ role: 'user', content: prompt }] },
    responsePayload: { content: `Response for ${prompt}` },
    ...overrides,
  };
}
