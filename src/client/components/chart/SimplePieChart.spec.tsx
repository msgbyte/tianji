import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SimplePieChart } from './SimplePieChart';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('recharts', async () => {
  const React = await import('react');
  const Passthrough = ({ children }: { children?: ReactNode }) =>
    React.createElement('div', null, children);

  return {
    ResponsiveContainer: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Tooltip: () => null,
    Label: () => null,
    Legend: () => null,
  };
});

describe('SimplePieChart', () => {
  test('renders a segment description list with labels, counts, and percentages', () => {
    render(
      <SimplePieChart
        data={[
          { label: 'iOS', count: 4, fill: 'var(--color-ios)' },
          { label: 'Android', count: 2, fill: 'var(--color-android)' },
        ]}
        chartConfig={{
          ios: { label: 'iOS', color: 'hsl(var(--chart-1))' },
          android: { label: 'Android', color: 'hsl(var(--chart-2))' },
        }}
        showLegend={true}
      />
    );

    const legend = screen.getByRole('list', {
      name: 'Pie chart segments',
    });

    expect(legend).toHaveTextContent('iOS');
    expect(legend).toHaveTextContent('4');
    expect(legend).toHaveTextContent('66.7%');
    expect(legend).toHaveTextContent('Android');
    expect(legend).toHaveTextContent('2');
    expect(legend).toHaveTextContent('33.3%');
  });
});
