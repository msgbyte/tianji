import { MonitorInfo } from '../../../../types';

export interface MonitorProvider {
  label: string;
  name: string;
  link?: (info: MonitorInfo) => React.ReactNode;
  form: React.ComponentType;
  overview?: MonitorOverviewComponent[];

  /**
   * Custom chart value label name
   */
  valueLabel?: string;

  /**
   * Custom chart value label number display
   */
  valueFormatter?: (value: number) => string;
  /**
   * Minimum value of this provider
   *
   * Helps reduce pressure on third-party services
   *
   * unit: second
   */
  minInterval?: number;
}

export type MonitorOverviewComponent = React.ComponentType<{
  monitorId: string;
}>;
