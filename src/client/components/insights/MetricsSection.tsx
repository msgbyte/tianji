import React from 'react';
import { MetricsBlock } from './MetricsBlock';

interface MetricsSectionProps {
  title: string;
}
export const MetricsSection: React.FC<MetricsSectionProps> = React.memo(
  (props) => {
    return (
      <div>
        <div>{props.title}</div>

        <MetricsBlock title={props.title} list={[]} />
      </div>
    );
  }
);
MetricsSection.displayName = 'MetricsSection';
