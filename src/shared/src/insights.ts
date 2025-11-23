import { get, uniq } from 'lodash-es';
import { DateUnit, getDateArray } from './date';

export interface MetricsInfo {
  name: string;
  math: 'events' | 'sessions' | 'p50' | 'p90' | 'p95' | 'p99' | 'avg';
  alias?: string;
}

export type FilterInfoValue = string | number | string[] | number[];

export type FilterInfoType = 'number' | 'string' | 'boolean' | 'date' | 'array';

export interface FilterInfo {
  name: string;
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
  type: FilterInfoType;
  customGroups?: CustomGroupInfo[];
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
  groups?: {
    value: string;
  }[];
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
      for (const g of groups) {
        const allGroupValue = uniq(
          data.map((item) => get(item, `%${g.value}`) as any)
        );

        result.push(
          ...allGroupValue.map((gv) => ({
            name: m.name,
            alias: m.alias,
            [g.value]: gv,
            data: getDateArray(
              data
                .filter((item) => get(item, `%${g.value}`) === gv)
                .map((item) => {
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
          }))
        );
      }
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
