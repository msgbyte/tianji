import { TimeEventChartData } from '@/components/chart/TimeEventChart';
import dayjs from 'dayjs';

export const PUBLIC_RANGE_OPTIONS = [
  'realtime',
  '24h',
  '7d',
  '30d',
  '90d',
] as const;

export type PublicRangeOption = (typeof PUBLIC_RANGE_OPTIONS)[number];

export interface TrendPoint {
  date: string;
  value: number;
}

const RANGE_CONFIG: Record<
  PublicRangeOption,
  { unit: dayjs.ManipulateType; span: number }
> = {
  realtime: { unit: 'minute', span: 60 },
  '24h': { unit: 'hour', span: 24 },
  '7d': { unit: 'day', span: 7 },
  '30d': { unit: 'day', span: 30 },
  '90d': { unit: 'day', span: 90 },
};

export function fillPageviewsTrend(
  range: PublicRangeOption,
  trend: TrendPoint[]
): TimeEventChartData[] {
  const config = RANGE_CONFIG[range] ?? RANGE_CONFIG['24h'];
  const normalized = new Map<number, number>();

  for (const item of trend) {
    const ts = dayjs(item.date);
    if (!ts.isValid()) {
      continue;
    }
    const bucket = ts.startOf(config.unit).valueOf();
    normalized.set(bucket, Number(item.value) || 0);
  }

  let end = trend.length > 0 ? dayjs(trend[trend.length - 1].date) : dayjs();
  if (!end.isValid()) {
    end = dayjs();
  }
  end = end.startOf(config.unit);

  let start =
    trend.length > 0
      ? dayjs(trend[0].date).startOf(config.unit)
      : end.subtract(config.span, config.unit);

  let span = end.diff(start, config.unit);
  if (span <= 0) {
    start = end.subtract(config.span, config.unit);
    span = config.span;
  } else if (span < config.span) {
    start = start.subtract(config.span - span, config.unit);
    span = config.span;
  } else if (span > config.span) {
    span = config.span;
    start = end.subtract(span, config.unit);
  }

  const result: TimeEventChartData[] = [];
  for (let i = 0; i <= span; i++) {
    const current = start.add(i, config.unit);
    const key = current.valueOf();
    result.push({
      date: current.toISOString(),
      value: normalized.get(key) ?? 0,
    });
  }

  return result;
}
