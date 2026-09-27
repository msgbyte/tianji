import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import {
  AIGatewayLogDetail,
  type AIGatewayLogItem,
  type AIGatewayLogDetailItem,
} from './AIGatewayLogDetail';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';

const detailQuery = vi.hoisted(() => vi.fn());

vi.mock('@/api/trpc', () => ({
  trpc: { aiGateway: { logDetail: { useQuery: detailQuery } } },
}));

function mockDetail(item: AIGatewayLogDetailItem): AIGatewayLogItem {
  detailQuery.mockReturnValue({ data: item, error: null, refetch: vi.fn() });
  const { requestPayload, responsePayload, ...summary } = item;
  return summary;
}

vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => (key === 'Close' ? 'Cerrar' : key),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        Messages: 'Mensajes',
        Tools: 'Herramientas',
        'Raw Request': 'Solicitud sin procesar',
        'Message attachment': 'Archivo adjunto del mensaje',
        Parameters: 'Parámetros',
        Content: 'Contenido',
        'Raw Response': 'Respuesta sin procesar',
      };

      return translations[key] ?? key;
    },
  }),
}));

describe('AIGatewayLogDetail', () => {
  test('keeps metadata visible while payloads load, fail, and switch between logs', async () => {
    const item = {
      id: 'log_loading',
      workspaceId: 'workspace_1',
      gatewayId: 'gateway_1',
      modelName: 'gpt-5',
      status: 'Success',
      duration: 234,
      ttft: 56,
      tpot: 78,
      inputToken: 12,
      outputToken: 34,
      cacheReadInputToken: 0,
      cacheWriteInputToken: 0,
      price: 0.001,
      createdAt: '2026-08-29T00:00:00Z',
    } as AIGatewayLogItem;
    const refetch = vi.fn();
    detailQuery.mockReturnValue({ data: undefined, error: null, refetch });
    const { rerender } = render(<AIGatewayLogDetail item={item} />);

    expect(screen.getByText('gpt-5')).toBeVisible();
    expect(screen.getByText('234 ms')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Loading payloads…');
    expect(detailQuery).toHaveBeenLastCalledWith(
      {
        workspaceId: 'workspace_1',
        gatewayId: 'gateway_1',
        logId: 'log_loading',
      },
      expect.any(Object)
    );

    detailQuery.mockReturnValue({
      data: undefined,
      error: new Error('offline'),
      refetch,
    });
    rerender(<AIGatewayLogDetail item={{ ...item }} />);
    expect(screen.getByText('234 ms')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to load payloads'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledOnce();

    detailQuery.mockReturnValue({
      data: {
        ...item,
        requestPayload: { messages: [{ role: 'user', content: 'Hola' }] },
        responsePayload: { content: 'Respuesta' },
      },
      error: null,
      refetch,
    });
    rerender(<AIGatewayLogDetail item={{ ...item }} />);
    expect(screen.getByText(/Hola/)).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    detailQuery.mockReturnValue({ data: undefined, error: null, refetch });
    rerender(
      <AIGatewayLogDetail
        item={{ ...item, id: 'log_next', modelName: 'next-model' }}
      />
    );
    expect(screen.getByText('next-model')).toBeVisible();
    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.queryByText(/Hola/)).not.toBeInTheDocument();
  });

  test('switches between decomposed request tabs', async () => {
    render(
      <AIGatewayLogDetail
        item={mockDetail({
          id: 'log_1',
          workspaceId: 'workspace_1',
          gatewayId: 'gateway_1',
          inputToken: 12,
          outputToken: 34,
          cacheReadInputToken: 0,
          cacheWriteInputToken: 0,
          stream: true,
          modelName: 'custom',
          modelProvider: 'openai',
          status: 'Success',
          duration: 234,
          ttft: 56,
          tpot: 78,
          price: 0.001,
          requestPayload: {
            model: 'custom',
            tools: [
              {
                type: 'function',
                function: { name: 'read' },
              },
            ],
            messages: [
              { role: 'system', content: 'System instructions' },
              { role: 'user', content: 'Actual user input' },
            ],
            stream: true,
          },
          responsePayload: { content: 'Response text' },
          userId: null,
          createdAt: '2026-08-29T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:01.000Z',
        } as AIGatewayLogDetailItem)}
      />
    );

    expect(screen.getByRole('tab', { name: 'Mensajes' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.queryByText(/"name": "read"/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Herramientas' }));
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
    expect(screen.queryByText('Actual user input')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('tab', { name: 'Solicitud sin procesar' })
    );
    expect(screen.getByText(/"model": "custom"/)).toBeVisible();
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
  });

  test('keeps image preview interactions separate from the log sheet', async () => {
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      getComputedStyle(element)
    );

    render(
      <Sheet defaultOpen>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Detalle del registro</SheetTitle>
          <ScrollArea>
            <AIGatewayLogDetail
              item={mockDetail({
                id: 'log_2',
                workspaceId: 'workspace_1',
                gatewayId: 'gateway_1',
                inputToken: 12,
                outputToken: 34,
                cacheReadInputToken: 0,
                cacheWriteInputToken: 0,
                stream: false,
                modelName: 'custom',
                modelProvider: 'openai',
                status: 'Success',
                duration: 234,
                ttft: 56,
                tpot: 78,
                price: 0.001,
                requestPayload: {
                  messages: [
                    {
                      role: 'user',
                      content: [
                        { type: 'text', text: 'Inspect this image' },
                        {
                          type: 'image_url',
                          image_url: {
                            url: 'data:image/png;base64,aGVsbG8=',
                          },
                        },
                      ],
                    },
                  ],
                },
                responsePayload: { content: 'Response text' },
                userId: null,
                createdAt: '2026-08-29T00:00:00.000Z',
                updatedAt: '2026-08-29T00:00:01.000Z',
              } as AIGatewayLogDetailItem)}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );

    const thumbnail = screen.getByRole('img', {
      name: 'Archivo adjunto del mensaje',
    });
    expect(thumbnail).toHaveAttribute('src', 'data:image/png;base64,aGVsbG8=');

    await userEvent.click(thumbnail);
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      'data:image/png;base64,aGVsbG8='
    );

    const previewImage = document.querySelector('.ant-image-preview-img')!;
    expect(window.getComputedStyle(previewImage).pointerEvents).toBe('auto');
    const preview = screen.getByRole('dialog', {
      name: 'Archivo adjunto del mensaje',
    });
    await waitFor(() =>
      expect(preview.contains(document.activeElement)).toBe(true)
    );
    await userEvent.click(screen.getByRole('img', { name: 'zoom-in' }));
    await waitFor(() => {
      expect((previewImage as HTMLImageElement).style.transform).toContain(
        'scale3d(1.5, 1.5, 1)'
      );
    });
    await userEvent.click(screen.getByRole('img', { name: 'rotate-right' }));
    await waitFor(() => {
      expect((previewImage as HTMLImageElement).style.transform).toContain(
        'scale3d(1.5, 1.5, 1) rotate(90deg)'
      );
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(document.querySelector('.ant-image-preview-img')).toBeNull();
    });
    expect(
      screen.getByRole('dialog', { name: 'Detalle del registro' })
    ).toBeVisible();
    expect(thumbnail.closest('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.click(document.querySelector('.ant-image-preview-close')!);
    await waitFor(() => {
      expect(document.querySelector('.ant-image-preview-img')).toBeNull();
    });
    expect(
      screen.getByRole('dialog', { name: 'Detalle del registro' })
    ).toBeVisible();

    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Detalle del registro' })
    ).toBeNull();

    vi.restoreAllMocks();
  });

  test('switches between decomposed response tabs', async () => {
    render(
      <AIGatewayLogDetail
        item={mockDetail({
          id: 'log_3',
          workspaceId: 'workspace_1',
          gatewayId: 'gateway_1',
          inputToken: 12,
          outputToken: 34,
          cacheReadInputToken: 0,
          cacheWriteInputToken: 0,
          stream: true,
          modelName: 'custom',
          modelProvider: 'openai',
          status: 'Success',
          duration: 234,
          ttft: 56,
          tpot: 78,
          price: 0.001,
          requestPayload: {},
          responsePayload: {
            usage: { total_tokens: 3 },
            content: 'Response text',
            provider: 'Google',
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'lookup',
                  arguments: '{"city":"Paris"}',
                },
              },
            ],
          },
          userId: null,
          createdAt: '2026-08-29T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:01.000Z',
        } as AIGatewayLogDetailItem)}
      />
    );

    expect(screen.getByRole('tab', { name: 'Contenido' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/Response text/)).toBeVisible();
    expect(screen.queryByText(/"provider": "Google"/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Parámetros' }));
    expect(screen.getByText(/"provider": "Google"/)).toBeVisible();
    expect(screen.getByText(/\\"city\\":\\"Paris\\"/)).toBeVisible();
    expect(screen.queryByText(/Response text/)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('tab', { name: 'Respuesta sin procesar' })
    );
    expect(screen.getByText(/Response text/)).toBeVisible();
    expect(screen.getByText(/"provider": "Google"/)).toBeVisible();
  });
});
