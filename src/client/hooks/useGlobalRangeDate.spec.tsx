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

test('manual refresh advances the relative range for every consumer', () => {
  const first = renderHook(useGlobalRangeDate);
  const second = renderHook(useGlobalRangeDate);
  const now = new Date('2026-07-10T13:00:00Z');
  vi.setSystemTime(now);

  act(() => first.result.current.refresh());

  for (const consumer of [first, second]) {
    expect(consumer.result.current.endDate.valueOf()).toBe(now.valueOf());
    expect(consumer.result.current.startDate.valueOf()).toBe(
      dayjs(now).subtract(1, 'day').valueOf()
    );
  }
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
