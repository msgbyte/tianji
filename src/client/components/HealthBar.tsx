import clsx from 'clsx';
import React from 'react';

type HealthStatus = 'health' | 'error' | 'warning' | 'none';

export interface HealthBarBeat {
  title?: string;
  status: HealthStatus;
}

export interface HealthBarProps {
  size?: 'small' | 'large';
  beats: HealthBarBeat[];
}
export const HealthBar: React.FC<HealthBarProps> = React.memo((props) => {
  const size = props.size ?? 'small';

  return (
    <div
      className={clsx('flex', {
        'gap-[3px]': size === 'small',
        'gap-1': size === 'large',
      })}
    >
      {props.beats.map((beat, i) => (
        <div
          key={i}
          title={beat.title}
          className={clsx(
            'rounded-full transition-transform hover:scale-150',
            {
              'h-4 w-[5px]': size === 'small',
              'h-8 w-2': size === 'large',
            },
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
