import React from 'react';
import { TipIcon } from '../TipIcon';

interface MonitorStatsBlockProps {
  title: string;
  tooltip?: string;
  desc: string;
  text: string;
}
export const MonitorStatsBlock: React.FC<MonitorStatsBlockProps> = React.memo(
  (props) => {
    return (
      <div>
        <div className="mb-0.5 text-xs font-bold sm:text-base">
          {props.title}
          {props.tooltip && (
            <TipIcon className="ml-1" content={props.tooltip} />
          )}
        </div>
        <div className="text-gray-500">{props.desc}</div>
        <div>{props.text}</div>
      </div>
    );
  }
);
MonitorStatsBlock.displayName = 'MonitorStatsBlock';
