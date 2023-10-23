import React from 'react';

interface MonitorStatsBlockProps {
  title: string;
  desc: string;
  text: string;
}
export const MonitorStatsBlock: React.FC<MonitorStatsBlockProps> = React.memo(
  (props) => {
    return (
      <div>
        <div className="font-bold mb-0.5">{props.title}</div>
        <div className="text-gray-500">{props.desc}</div>
        <div>{props.text}</div>
      </div>
    );
  }
);
MonitorStatsBlock.displayName = 'MonitorStatsBlock';
