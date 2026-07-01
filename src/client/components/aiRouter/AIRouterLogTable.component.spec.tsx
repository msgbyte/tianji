import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AIRouterLogTable } from './AIRouterLogTable';

const aiGatewayLogsUseInfiniteQuery = vi.hoisted(() => vi.fn());
const aiGatewayLogsResult = vi.hoisted(() => ({
  data: {
    pages: [
      {
        items: [
          {
            id: 'gateway_log_1',
            workspaceId: 'workspace_1',
            gatewayId: 'gateway_1',
            inputToken: 12,
            outputToken: 34,
            cacheReadInputToken: 0,
            cacheWriteInputToken: 0,
            stream: false,
            modelName: 'gpt-5.5',
            modelProvider: 'openai',
            status: 'Success',
            duration: 234,
            ttft: 56,
            tpot: 78,
            price: 0.001,
            requestPayload: { messages: [{ role: 'user', content: 'hello' }] },
            responsePayload: { content: 'world' },
            userId: null,
            createdAt: new Date('2026-06-28T00:00:00.000Z'),
            updatedAt: new Date('2026-06-28T00:00:01.000Z'),
          },
        ],
        nextCursor: undefined,
      },
    ],
  },
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetching: false,
  isLoading: false,
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    to,
    ...props
  }: React.PropsWithChildren<{
    params?: Record<string, string>;
    to: string;
  }> &
    React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={to.replace('$gatewayId', params?.gatewayId ?? '')}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    open,
  }: React.PropsWithChildren<{ open?: boolean }>) =>
    open ? <div role="dialog">{children}</div> : null,
  SheetContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SheetDataSection: ({
    children,
    label,
  }: React.PropsWithChildren<{ label: string }>) => (
    <section>
      <div>{label}</div>
      <div>{children}</div>
    </section>
  ),
  SheetHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/CodeBlock', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre>{code}</pre>,
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    aiRouter: {
      logs: {
        useInfiniteQuery: () => ({
          data: {
            pages: [
              {
                items: [
                  {
                    id: 'router_log_1',
                    workspaceId: 'workspace_1',
                    routerId: 'router_1',
                    protocol: 'openai-chat',
                    status: 'Success',
                    finalGatewayId: 'gateway_1',
                    finalGatewayLogId: 'gateway_log_1',
                    attemptGatewayIds: ['gateway_1'],
                    attemptGatewayLogIds: ['gateway_log_1'],
                    attemptErrors: null,
                    attemptCount: 1,
                    duration: 123,
                    createdAt: new Date('2026-06-28T00:00:00.000Z'),
                  },
                ],
                nextCursor: undefined,
              },
            ],
          },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetching: false,
          isFetchingNextPage: false,
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
    },
    aiGateway: {
      logs: {
        useInfiniteQuery: aiGatewayLogsUseInfiniteQuery,
      },
    },
  },
}));

aiGatewayLogsUseInfiniteQuery.mockImplementation((_input, options) =>
  options?.enabled ? aiGatewayLogsResult : { ...aiGatewayLogsResult, data: undefined }
);

describe('AIRouterLogTable', () => {
  test('links final gateway names and opens the final gateway log detail sheet', async () => {
    render(
      <AIRouterLogTable
        routerId="router_1"
        gateways={[{ id: 'gateway_1', name: 'Primary Gateway' }]}
      />
    );

    const gatewayLink = screen.getByRole('link', {
      name: 'Primary Gateway',
    });
    expect(gatewayLink).toHaveAttribute('href', '/aiGateway/gateway_1');
    expect(aiGatewayLogsUseInfiniteQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace_1',
        gatewayId: '',
        limit: 1,
      }),
      expect.objectContaining({
        enabled: false,
      })
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'gateway_log_1',
      })
    );

    await waitFor(() => {
      expect(aiGatewayLogsUseInfiniteQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace_1',
          gatewayId: 'gateway_1',
          logId: 'gateway_log_1',
          limit: 1,
        }),
        expect.any(Object)
      );
    });

    expect(screen.getByRole('dialog')).toHaveTextContent('gateway_log_1');
    expect(screen.getByRole('dialog')).toHaveTextContent('gpt-5.5');
  });
});
