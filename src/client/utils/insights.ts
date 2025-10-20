import { MetricsInfo, FilterInfo, GroupInfo, DateUnit } from '@tianji/shared';
import { TimeEventChartType } from '../components/chart/TimeEventChart';
import { InsightType } from '../store/insights';
import dayjs from 'dayjs';

interface SerializableInsightsState {
  insightId: string;
  insightType: InsightType;
  currentMetrics: (MetricsInfo | null)[];
  currentFilters: (FilterInfo | null)[];
  currentGroups: (GroupInfo | null)[];
  currentDateKey: string;
  currentDateRange: [number, number]; // timestamps in milliseconds
  currentDateUnit: DateUnit;
  currentChartType: TimeEventChartType;
}

/**
 * Convert date key to date range based on current time
 * Supports: today, yesterday, 3D, 7D, 30D, 3M, 6M, 12M
 */
export function dateKeyToDateRange(dateKey: string): [Date, Date] | null {
  const now = dayjs();

  switch (dateKey) {
    case 'today':
      return [now.startOf('day').toDate(), now.endOf('day').toDate()];

    case 'yesterday':
      return [
        now.subtract(1, 'day').startOf('day').toDate(),
        now.subtract(1, 'day').endOf('day').toDate(),
      ];

    case '3D':
      return [
        now.subtract(3, 'day').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    case '7D':
      return [
        now.subtract(7, 'day').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    case '30D':
      return [
        now.subtract(30, 'day').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    case '3M':
      return [
        now.subtract(3, 'month').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    case '6M':
      return [
        now.subtract(6, 'month').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    case '12M':
      return [
        now.subtract(12, 'month').startOf('day').toDate(),
        now.endOf('day').toDate(),
      ];

    default:
      return null;
  }
}

/**
 * Serialize InsightsStore state to JSON string
 * Converts Date objects to timestamps and filters out null/empty values
 */
export function serializeInsightsState(query: {
  insightId: string;
  insightType: InsightType;
  currentMetrics: (MetricsInfo | null)[];
  currentFilters: (FilterInfo | null)[];
  currentGroups: (GroupInfo | null)[];
  currentDateKey: string;
  currentDateRange: [Date, Date];
  currentDateUnit: DateUnit;
  currentChartType: TimeEventChartType;
}): string {
  const serializable: SerializableInsightsState = {
    insightId: query.insightId,
    insightType: query.insightType,
    currentMetrics: query.currentMetrics.filter((m) => m !== null),
    currentFilters: query.currentFilters.filter((f) => f !== null),
    currentGroups: query.currentGroups.filter((g) => g !== null),
    currentDateKey: query.currentDateKey,
    currentDateRange: [
      new Date(query.currentDateRange[0]).getTime(),
      new Date(query.currentDateRange[1]).getTime(),
    ],
    currentDateUnit: query.currentDateUnit,
    currentChartType: query.currentChartType,
  };

  return JSON.stringify(serializable);
}

/**
 * Deserialize JSON string to InsightsStore state
 * Converts timestamps back to Date objects and validates structure
 * If dateKey is provided, calculates dateRange based on current time
 */
export function deserializeInsightsState(queryStr: string): Partial<{
  insightId: string;
  insightType: InsightType;
  currentMetrics: (MetricsInfo | null)[];
  currentFilters: (FilterInfo | null)[];
  currentGroups: (GroupInfo | null)[];
  currentDateKey: string;
  currentDateRange: [Date, Date];
  currentDateUnit: DateUnit;
  currentChartType: TimeEventChartType;
}> | null {
  try {
    const parsed = JSON.parse(queryStr) as SerializableInsightsState;

    // Validate required fields
    if (!parsed.insightId || !parsed.insightType) {
      return null;
    }

    const dateKey = parsed.currentDateKey || '7D';

    // Try to calculate dateRange from dateKey first (for dynamic date ranges)
    let dateRange: [Date, Date];
    const calculatedRange = dateKeyToDateRange(dateKey);

    if (calculatedRange) {
      // Use calculated range based on current time
      dateRange = calculatedRange;
    } else if (parsed.currentDateRange) {
      // Fall back to stored timestamps for custom date ranges
      dateRange = [
        new Date(parsed.currentDateRange[0]),
        new Date(parsed.currentDateRange[1]),
      ];
    } else {
      // Default to last 30 days
      dateRange = dateKeyToDateRange('7D')!;
    }

    return {
      insightId: parsed.insightId,
      insightType: parsed.insightType,
      currentMetrics: Array.isArray(parsed.currentMetrics)
        ? parsed.currentMetrics
        : [],
      currentFilters: Array.isArray(parsed.currentFilters)
        ? parsed.currentFilters
        : [],
      currentGroups: Array.isArray(parsed.currentGroups)
        ? parsed.currentGroups
        : [],
      currentDateKey: dateKey,
      currentDateRange: dateRange,
      currentDateUnit: parsed.currentDateUnit || 'day',
      currentChartType: parsed.currentChartType || 'line',
    };
  } catch (error) {
    console.error('Failed to deserialize insights state:', error);
    return null;
  }
}
