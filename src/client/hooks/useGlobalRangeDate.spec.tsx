import { act, renderHook } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DateRange, useGlobalStateStore } from '../store/global';
import { useGlobalRangeDate } from './useGlobalRangeDate';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-10T12:00:00Z'));
  useGlobalStateStore.setState(useGlobalStateStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
  useGlobalStateStore.setState(useGlobalStateStore.getInitialState());
});

test.each([
  [DateRange.Last24Hours, 24],
  [DateRange.Last14Hours, 14],
])('manual refresh advances %s for every consumer', (dateRange, hours) => {
  useGlobalStateStore.setState({ dateRange });
  const first = renderHook(useGlobalRangeDate);
  const second = renderHook(useGlobalRangeDate);
  const now = new Date('2026-07-10T13:00:00Z');
  vi.setSystemTime(now);

  act(() => first.result.current.refresh());

  for (const consumer of [first, second]) {
    expect(consumer.result.current.endDate.valueOf()).toBe(now.valueOf());
    expect(consumer.result.current.startDate.valueOf()).toBe(
      now.valueOf() - hours * 60 * 60 * 1000
    );
  }
});

test('last 14 hours spans midnight and uses hourly buckets', () => {
  useGlobalStateStore.setState({ dateRange: DateRange.Last14Hours });
  const { result } = renderHook(useGlobalRangeDate);

  expect(result.current.startDate.toISOString()).toBe(
    '2026-07-09T22:00:00.000Z'
  );
  expect(result.current.endDate.toISOString()).toBe('2026-07-10T12:00:00.000Z');
  expect(result.current.unit).toBe('hour');
  expect(result.current.label).toBe('Last 14 hours');
});

test('manual refresh preserves a selected custom range', () => {
  const startDate = dayjs('2026-07-01T00:00:00Z');
  const endDate = dayjs('2026-07-02T00:00:00Z');
  useGlobalStateStore.setState({
    dateRange: DateRange.Custom,
    startDate,
    endDate,
  });
  const { result } = renderHook(useGlobalRangeDate);
  vi.setSystemTime(new Date('2026-07-11T12:00:00Z'));

  act(() => result.current.refresh());

  expect(result.current.startDate.valueOf()).toBe(startDate.valueOf());
  expect(result.current.endDate.valueOf()).toBe(endDate.valueOf());
});
