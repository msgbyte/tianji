import clsx from 'clsx';
import React from 'react';

type HealthStatus = 'health' | 'error' | 'warning' | 'none';

interface HealthBarProps {
  beats: { title?: string; status: HealthStatus }[];
}
export const HealthBar: React.FC<HealthBarProps> = React.memo((props) => {
  return (
    <div className="flex">
      {props.beats.map((beat, i) => (
        <div
          key={i}
          title={beat.title}
          className={clsx(
            'rounded-full w-1 h-4 m-0.5 hover:scale-150 transition-transform',
            {
              'bg-green-500': beat.status === 'health',
              'bg-red-600': beat.status === 'error',
              'bg-yellow-400': beat.status === 'warning',
              'bg-gray-400': beat.status === 'none',
            }
          )}
        />
      ))}
    </div>
  );
});
HealthBar.displayName = 'HealthBar';
