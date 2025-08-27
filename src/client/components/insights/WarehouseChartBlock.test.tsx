import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseChartBlock } from './WarehouseChartBlock';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('../chart/TimeEventChart', () => ({
  TimeEventChart: () => (
    <div data-testid="time-event-chart">TimeEventChart</div>
  ),
  useTimeEventChartConfig: () => ({}),
}));

describe('WarehouseChartBlock', () => {
  it('renders title and toggles source data table', async () => {
    const user = userEvent.setup();
    const data = [
      { date: '2024-01-01', a: 1, b: 2 },
      { date: '2024-01-02', a: 3, b: 4 },
    ];

    render(
      <WarehouseChartBlock id="1" title="My Chart" data={data} unit="day" />
    );

    expect(screen.getByText('My Chart')).toBeInTheDocument();
    expect(screen.getByTestId('time-event-chart')).toBeInTheDocument();
    expect(screen.getByText('Source Data')).toBeInTheDocument();

    // Initially table is hidden; click the toggle button to show
    const toggleBtnShow = screen.getByLabelText('Show');
    await user.click(toggleBtnShow);

    // Table headers should appear
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();

    // Click again to hide
    const toggleBtnHide = screen.getByLabelText('Hide');
    await user.click(toggleBtnHide);

    expect(screen.queryByText('Date')).not.toBeInTheDocument();
  });
});
