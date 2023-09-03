import { DATA_TYPE } from './const';

type ObjectValues<T> = T[keyof T];
export type DynamicDataType = ObjectValues<typeof DATA_TYPE>;

export interface DynamicData {
  [key: string]:
    | number
    | string
    | DynamicData
    | number[]
    | string[]
    | DynamicData[];
}
