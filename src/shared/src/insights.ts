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
