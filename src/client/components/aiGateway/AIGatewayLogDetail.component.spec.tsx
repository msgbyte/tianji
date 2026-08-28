import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import {
  AIGatewayLogDetail,
  type AIGatewayLogItem,
} from './AIGatewayLogDetail';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

    expect(screen.getByRole('tab', { name: 'Messages' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.queryByText(/"name": "read"/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Tools' }));
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
    expect(screen.queryByText('Actual user input')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Raw Request' }));
    expect(screen.getByText(/"model": "custom"/)).toBeVisible();
    expect(screen.getByText(/Actual user input/)).toBeVisible();
    expect(screen.getByText(/"name": "read"/)).toBeVisible();
  });
});
