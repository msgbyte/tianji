import { MonitorInfo } from '../../../../types';

export interface MonitorProvider {
  label: string;
  name: string;
  link?: (info: MonitorInfo) => React.ReactNode;
  form: React.ComponentType;
  overview?: MonitorOverviewComponent[];
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
}

export type MonitorOverviewComponent = React.ComponentType<{
  monitorId: string;
}>;
