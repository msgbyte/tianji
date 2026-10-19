import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AIGatewayStrategyEditor } from './AIGatewayStrategyEditor';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../ui/alert', () => ({
  Alert: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('../ui/button', () => ({
  Button: ({
    children,
    Icon,
    ...props
  }: React.PropsWithChildren<{ Icon?: React.ComponentType }>) => (
    <button {...props}>
      {Icon ? <Icon /> : null}
      {children}
    </button>
  ),
}));

vi.mock('../ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('../ui/table', () => ({
  Table: ({ children }: React.PropsWithChildren) => <table>{children}</table>,
  TableBody: ({ children }: React.PropsWithChildren) => (
    <tbody>{children}</tbody>
  ),
  TableCell: ({
    children,
    colSpan,
  }: React.PropsWithChildren<{ colSpan?: number }>) => (
    <td colSpan={colSpan}>{children}</td>
  ),
  TableHead: ({ children }: React.PropsWithChildren) => (
    <th>{children}</th>
  ),
  TableHeader: ({ children }: React.PropsWithChildren) => (
    <thead>{children}</thead>
  ),
  TableRow: ({ children }: React.PropsWithChildren) => <tr>{children}</tr>,
}));

vi.mock('../ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

vi.mock('./AIGatewayPricingModal', () => ({
  AIGatewayPricingModal: () => null,
}));

afterEach(() => {
  cleanup();
});

describe('AIGatewayStrategyEditor', () => {
  test('renders cache write price in rules mode', () => {
    render(
      <AIGatewayStrategyEditor
        value={JSON.stringify({
          price: [
            {
              inputTokenMin: 0,
              inputTokenMax: null,
              input: 3,
              output: 15,
              cacheRead: 0.3,
              cacheWrite: 3.75,
            },
          ],
        })}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Cache Write / 1M')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3.75')).toBeInTheDocument();
  });

  test('writes cache write price changes to strategy JSON', () => {
    const handleChange = vi.fn();

    render(
      <AIGatewayStrategyEditor
        value={JSON.stringify({
          price: [
            {
              inputTokenMin: 0,
              inputTokenMax: null,
              input: 3,
              output: 15,
              cacheRead: 0.3,
              cacheWrite: 3.75,
            },
          ],
        })}
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('3.75');
    fireEvent.change(input, { target: { value: '6.25' } });

    const lastValue = handleChange.mock.lastCall?.[0];
    expect(JSON.parse(lastValue)).toEqual({
      price: [
        {
          inputTokenMin: 0,
          inputTokenMax: null,
          input: 3,
          output: 15,
          cacheRead: 0.3,
          cacheWrite: 6.25,
        },
      ],
    });
  });
});
