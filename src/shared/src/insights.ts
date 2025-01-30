export interface MetricsInfo {
  name: string;
  math: 'events' | 'sessions';
}

export type FilterInfoValue = string | number | string[] | number[];

export type FilterInfoType = 'number' | 'string' | 'boolean' | 'date' | 'array';

export interface FilterInfo {
  name: string;
  operator: string;
  type: FilterInfoType;
  value: FilterInfoValue | null;
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
