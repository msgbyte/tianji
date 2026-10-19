import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApplicationEventsChart } from './ApplicationEventsChart';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
    React.cloneElement(children, { width: 800, height: 320 }),
}));

const dates = [
  '2026-07-01 00:00:00',
  '2026-07-02 00:00:00',
  '2026-07-03 00:00:00',
];
const data = {
  current: dates.map((date, index) => ({
    date,
    eventCount: index === 1 ? 0 : 10,
    sessionCount: index === 1 ? 0 : 2,
    totalTime: 0,
    avgEventsPerSession: 0,
    avgScreensPerSession: 0,
  })),
  eventBreakdown: [
    { date: dates[0], eventName: 'sessions', eventCount: 5 },
    { date: dates[0], eventName: 'a.b', eventCount: 3 },
    { date: dates[0], eventName: null, eventCount: 2 },
    { date: dates[2], eventName: 'sessions', eventCount: 4 },
    { date: dates[2], eventName: 'a.b', eventCount: 5 },
    { date: dates[2], eventName: null, eventCount: 1 },
  ],
};

describe('ApplicationEventsChart', () => {
  test('renders asynchronously loaded event stacks and a session curve with safe event keys', () => {
    const { container, rerender } = render(
      <ApplicationEventsChart unit="day" />
    );

    rerender(<ApplicationEventsChart unit="day" data={data} />);

    expect(screen.getByText('sessions')).toBeInTheDocument();
    expect(screen.getByText('a.b')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
    const bars = container.querySelectorAll('.recharts-bar');
    expect(bars).toHaveLength(3);
    for (const bar of bars) {
      expect(bar.querySelectorAll('.recharts-bar-rectangle path')).toHaveLength(
        2
      );
    }
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(1);
    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(2);
    expect(container.querySelector('svg')).toHaveAttribute(
      'role',
      'application'
    );
  });

  test('keeps a real Other event separate and updates series when the range changes', () => {
    const { container, rerender } = render(
      <ApplicationEventsChart unit="day" data={data} />
    );

    rerender(
      <ApplicationEventsChart
        unit="day"
        data={{
          current: data.current,
          eventBreakdown: [
            { date: dates[0], eventName: 'Other', eventCount: 8 },
            { date: dates[0], eventName: null, eventCount: 2 },
          ],
        }}
      />
    );

    expect(screen.queryByText('a.b')).not.toBeInTheDocument();
    expect(screen.getAllByText('Other')).toHaveLength(2);
    expect(container.querySelectorAll('.recharts-bar')).toHaveLength(2);

    rerender(
      <ApplicationEventsChart
        unit="day"
        data={{ current: [], eventBreakdown: [] }}
      />
    );
    expect(container.querySelectorAll('.recharts-bar')).toHaveLength(0);
  });

  test('shows bucket dates when navigating the tooltip with the keyboard', async () => {
    const { container } = render(
      <ApplicationEventsChart unit="day" data={data} />
    );
    const chart = screen.getByRole('application');
    fireEvent.focus(chart);

    const tooltip = container.querySelector('.recharts-tooltip-wrapper');
    await waitFor(() => expect(tooltip).toHaveTextContent('Jul 01'));
    expect(tooltip).toHaveTextContent('Sessions');

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    await waitFor(() => expect(tooltip).toHaveTextContent('Jul 02'));
    expect(tooltip).not.toHaveTextContent('Invalid Date');
  });

  test('keeps a single session data point visible in the series color', () => {
    const { container } = render(
      <ApplicationEventsChart
        unit="day"
        data={{
          current: data.current.slice(0, 1),
          eventBreakdown: data.eventBreakdown.slice(0, 3),
        }}
      />
    );

    expect(container.querySelector('.recharts-line-dot')).toHaveAttribute(
      'fill',
      'var(--color-sessions)'
    );
  });
});
