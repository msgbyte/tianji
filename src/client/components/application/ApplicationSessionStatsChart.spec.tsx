import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';
import { ApplicationCountryChart } from './ApplicationCountryChart';

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/trpc', () => ({
  trpc: { application: { sessionStats: { useQuery } } },
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace',
}));

vi.mock('@/hooks/useGlobalRangeDate', () => ({
  useGlobalRangeDate: () => ({ startDate: new Date(0), endDate: new Date(0) }),
}));

describe('ApplicationSessionStatsChart', () => {
  test('folds items beyond the top five into Other and shows shares of the total', () => {
    useQuery.mockReturnValue({
      isLoading: false,
      data: [
        { name: '1.4.2', count: 40 },
        { name: '1.4.1', count: 20 },
        { name: '1.3.9', count: 15 },
        { name: '1.3.0', count: 10 },
        { name: 'Unknown', count: 5 },
        { name: '1.2.0', count: 6 },
        { name: '1.1.0', count: 4 },
      ],
    });

    render(
      <ApplicationSessionStatsChart
        applicationId="app"
        groupBy="version"
        title="Versión"
        formatLabel={(name) => `v${name}`}
      />
    );

    expect(screen.getByText('100 Sessions')).toBeInTheDocument();
    const rows = within(
      screen.getByRole('list', { name: 'Versión' })
    ).getAllByRole('listitem');
    expect(rows).toHaveLength(6);
    expect(rows[0]).toHaveTextContent('v1.4.2');
    expect(rows[0]).toHaveTextContent('40.0%');
    expect(rows[4]).toHaveTextContent('Unknown');
    expect(rows[5]).toHaveTextContent('Other');
    expect(rows[5]).toHaveTextContent('10');
    expect(rows[5]).toHaveTextContent('10.0%');
  });

  test('shows country names with flags instead of codes', () => {
    useQuery.mockReturnValue({
      isLoading: false,
      data: [
        { name: 'ES', count: 3 },
        { name: 'Unknown', count: 1 },
      ],
    });

    render(<ApplicationCountryChart applicationId="app" />);

    expect(screen.getByText('🇪🇸 Spain')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });
});
