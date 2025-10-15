import { MetricsInfo, FilterInfo, GroupInfo, DateUnit } from '@tianji/shared';
import { TimeEventChartType } from '../components/chart/TimeEventChart';
import { InsightType } from '../store/insights';

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
      query.currentDateRange[0].getTime(),
      query.currentDateRange[1].getTime(),
    ],
    currentDateUnit: query.currentDateUnit,
    currentChartType: query.currentChartType,
  };

  return JSON.stringify(serializable);
}

/**
 * Deserialize JSON string to InsightsStore state
 * Converts timestamps back to Date objects and validates structure
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
      currentDateKey: parsed.currentDateKey || '30D',
      currentDateRange: [
        new Date(parsed.currentDateRange[0]),
        new Date(parsed.currentDateRange[1]),
      ],
      currentDateUnit: parsed.currentDateUnit || 'day',
      currentChartType: parsed.currentChartType || 'line',
    };
  } catch (error) {
    console.error('Failed to deserialize insights state:', error);
    return null;
  }
}
