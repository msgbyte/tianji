import { get, groupBy } from 'lodash-es';
import { DateUnit, getDateArray } from './date';

export interface MetricsInfo {
  name: string;
  math: 'events' | 'sessions' | 'p50' | 'p90' | 'p95' | 'p99' | 'avg';
  alias?: string;
}

export type FilterInfoValue = string | number | string[] | number[];

export type FilterInfoType = 'number' | 'string' | 'boolean' | 'date' | 'array';

export type InsightPropertySource = 'builtin' | 'custom';

export interface FilterInfo {
  name: string;
  source?: InsightPropertySource;
  operator: FilterOperator;
  type: FilterInfoType;
  value: FilterInfoValue | null;
}

export interface CustomGroupInfo {
  filterOperator: FilterOperator;
  filterValue: FilterInfoValue;
}

export interface GroupInfo {
  value: string;
  source?: InsightPropertySource;
  type: FilterInfoType;
  customGroups?: CustomGroupInfo[];
}

export function getInsightGroupAlias(
  group: Pick<GroupInfo, 'value' | 'source'>,
  index: number
) {
  // Custom aliases always start with %, so builtin aliases cannot collide.
  return group.source === 'builtin'
    ? `__builtin_group_${index}`
    : `%${group.value}`;
}

export type FilterNumberOperator =
  | 'equals'
  | 'not equals'
  | 'in list'
  | 'not in list'
  | 'greater than'
  | 'less than'
  | 'greater than or equal'
  | 'less than or equal'
  | 'between';
export type FilterStringOperator =
  | 'equals'
  | 'not equals'
  | 'contains'
  | 'not contains'
  | 'in list'
  | 'not in list';
export type FilterBooleanOperator = 'equals' | 'not equals';
export type FilterDateOperator = 'in day' | 'between';

export type FilterOperator =
  | FilterNumberOperator
  | FilterStringOperator
  | FilterBooleanOperator
  | FilterDateOperator;

export type GroupedTimeSeriesQuery = {
  time: {
    startAt: number;
    endAt: number;
    unit: DateUnit;
    timezone?: string;
  };
  metrics?: {
    name: string;
    alias?: string;
  }[];
  groups?: Pick<GroupInfo, 'value' | 'source'>[];
};

/**
 * Process the grouped time series data
 * @param query - The query object
 * @param context - The context object
 * @param data - The database result
 * @returns The processed data
 */
export function processGroupedTimeSeriesData(
  query: GroupedTimeSeriesQuery,
  context: { timezone: string },
  data: { date: string | null }[]
) {
  const { time, metrics = [], groups = [] } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  let result: {
    name: string;
    [groupName: string]: any;
    data: {
      date: string;
      value: number;
    }[];
  }[] = [];

  for (const m of metrics) {
    if (groups.length > 0) {
      const combinations = groupBy(data, (item) =>
        JSON.stringify(
          groups.map((g, index) => get(item, getInsightGroupAlias(g, index)))
        )
      );
      result.push(
        ...Object.values(combinations).map((rows) => ({
          ...Object.fromEntries(
            groups.map((g, index) => [
              g.value,
              get(rows[0], getInsightGroupAlias(g, index)),
            ])
          ),
          groupValues: groups.map((g, index) =>
            get(rows[0], getInsightGroupAlias(g, index))
          ),
          name: m.name,
          alias: m.alias,
          data: getDateArray(
            rows.map((item) => ({
              value: Number(get(item, m.alias ?? m.name)),
              date: String(item.date),
            })),
            startAt,
            endAt,
            unit,
            timezone
          ),
        }))
      );
    } else {
      result.push({
        name: m.name,
        alias: m.alias,
        data: getDateArray(
          data.map((item) => {
            return {
              value: Number(get(item, m.alias ?? m.name)),
              date: String(item.date),
            };
          }),
          startAt,
          endAt,
          unit,
          timezone
        ),
      });
    }
  }

  return result;
}
