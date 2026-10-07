import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { FilterParamsBlock } from './FilterParamsBlock';
import { BreakdownParamsBlock } from './BreakdownParamsBlock';
import { TableView } from './TableView';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  downloadCSVJson: vi.fn(),
}));
vi.mock('@i18next-toolkit/react', () => {
  const t = (key: string, values?: { name?: string }) =>
    key.replace('{{name}}', values?.name ?? '');
  return { t, useTranslation: () => ({ t }) };
});
vi.mock('@/api/trpc', () => ({
  trpc: { insights: { filterParamValues: { useQuery: mocks.useQuery } } },
}));
vi.mock('@/store/user', () => ({ useCurrentWorkspaceId: () => 'workspace' }));
vi.mock('@/store/insights', () => ({
  useInsightsStore: (selector: (state: unknown) => unknown) =>
    selector({ insightId: 'website', insightType: 'website' }),
}));
vi.mock('@/utils/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/dom')>()),
  downloadCSVJson: mocks.downloadCSVJson,
}));

const list = [
  {
    name: '$country',
    type: 'string' as const,
    count: 0,
    source: 'builtin' as const,
  },
  {
    name: '$country',
    type: 'string' as const,
    count: 1,
    source: 'custom' as const,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useQuery.mockReturnValue({ data: ['ES'] });
});

test('selects builtin filters and sends their source to value suggestions', () => {
  const onSelect = vi.fn();
  const props = { index: 0, list, info: null, onSelect, onDelete: vi.fn() };
  const { rerender } = render(<FilterParamsBlock {...props} />);
  fireEvent.click(screen.getByText('Built-in'));
  expect(onSelect).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: '$country', source: 'builtin' })
  );
  rerender(<FilterParamsBlock {...props} info={onSelect.mock.lastCall![0]} />);
  expect(mocks.useQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ paramName: '$country', source: 'builtin' }),
    expect.anything()
  );
  fireEvent.click(screen.getByText('$country'));
  fireEvent.click(screen.getByText('Custom'));
  expect(onSelect).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: '$country', source: 'custom' })
  );
  rerender(<FilterParamsBlock {...props} info={onSelect.mock.lastCall![0]} />);
  expect(mocks.useQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ paramName: '$country', source: 'custom' }),
    expect.anything()
  );
});

test('keeps the source when selecting a breakdown field', () => {
  const onSelect = vi.fn();
  render(
    <BreakdownParamsBlock
      index={0}
      list={list}
      info={null}
      onSelect={onSelect}
      onDelete={vi.fn()}
    />
  );
  fireEvent.click(screen.getByText('Built-in'));
  expect(onSelect).toHaveBeenLastCalledWith({
    value: '$country',
    type: 'string',
    source: 'builtin',
  });
});

test('shows and exports both values when builtin and custom groups share a name', () => {
  render(
    <TableView
      metrics={[{ name: '$page_view', math: 'events' }]}
      groups={list.map((item) => ({
        value: item.name,
        type: item.type,
        source: item.source,
      }))}
      data={[
        {
          name: '$page_view',
          $country: 'MX',
          groupValues: ['ES', 'MX'],
          data: [{ date: '2026-07-14', value: 2 }],
        },
      ]}
      dateUnit="day"
    />
  );
  expect(screen.getByText('ES')).toBeVisible();
  expect(screen.getByText('MX')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  expect(mocks.downloadCSVJson).toHaveBeenCalledWith(
    [
      {
        name: '$page_view',
        '$country (Built-in)': 'ES',
        $country: 'MX',
        '2026-07-14': 2,
      },
    ],
    'insights-table'
  );
});
