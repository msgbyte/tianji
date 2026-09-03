import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import {
  AIGatewayLogDetail,
  type AIGatewayLogItem,
} from './AIGatewayLogDetail';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        Messages: '消息',
        Tools: '工具',
        'Raw Request': '原始请求',
        'Message attachment': '消息附件',
        Parameters: '参数',
        Content: '内容',
        'Raw Response': '原始响应',
      };

      return translations[key] ?? key;
    },
  }),
}));

describe('AIGatewayLogDetail', () => {
  test('switches between decomposed request tabs', async () => {
    render(
      <AIGatewayLogDetail
        item={
          {
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
          } as AIGatewayLogItem
        }
      />
    );

    expect(screen.getByRole('tab', { name: '消息' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.queryByText(/"name": "read"/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '工具' }));
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
    expect(screen.queryByText('Actual user input')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '原始请求' }));
    expect(screen.getByText(/"model": "custom"/)).toBeVisible();
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
  });

  test('previews image_url content below the messages payload', async () => {
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      getComputedStyle(element)
    );

    render(
      <AIGatewayLogDetail
        item={
          {
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
                      image_url: { url: 'data:image/png;base64,aGVsbG8=' },
                    },
                  ],
                },
              ],
            },
            responsePayload: { content: 'Response text' },
            userId: null,
            createdAt: '2026-08-29T00:00:00.000Z',
            updatedAt: '2026-08-29T00:00:01.000Z',
          } as AIGatewayLogItem
        }
      />
    );

    const thumbnail = screen.getByRole('img', { name: '消息附件' });
    expect(thumbnail).toHaveAttribute(
      'src',
      'data:image/png;base64,aGVsbG8='
    );

    await userEvent.click(thumbnail);
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      'data:image/png;base64,aGVsbG8='
    );

    vi.restoreAllMocks();
  });

  test('switches between decomposed response tabs', async () => {
    render(
      <AIGatewayLogDetail
        item={
          {
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
          } as AIGatewayLogItem
        }
      />
    );

    expect(screen.getByRole('tab', { name: '内容' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/Response text/)).toBeVisible();
    expect(screen.queryByText(/"provider": "Google"/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '参数' }));
    expect(screen.getByText(/"provider": "Google"/)).toBeVisible();
    expect(screen.getByText(/\\"city\\":\\"Paris\\"/)).toBeVisible();
    expect(screen.queryByText(/Response text/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '原始响应' }));
    expect(screen.getByText(/Response text/)).toBeVisible();
    expect(screen.getByText(/"provider": "Google"/)).toBeVisible();
  });
});
