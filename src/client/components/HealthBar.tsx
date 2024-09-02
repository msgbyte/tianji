import { useResizeObserver } from '@/hooks/useResizeObserver';
import { cn } from '@/utils/style';
import clsx from 'clsx';
import React from 'react';

type HealthStatus = 'health' | 'error' | 'warning' | 'none';

export interface HealthBarBeat {
  title?: string;
  status: HealthStatus;
}

export interface HealthBarProps {
  className?: string;
  size?: 'small' | 'large';
  beats: HealthBarBeat[];
}
export const HealthBar: React.FC<HealthBarProps> = React.memo((props) => {
  const size = props.size ?? 'small';
  const [containerRef, containerRect] = useResizeObserver();

  const cellCount = props.beats.length;
  const cellNeedWidth = size === 'small' ? 8 : 12; // include gap

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex',
        {
          'gap-[3px] px-0.5 py-1.5': size === 'small',
          'gap-1 px-0.5 py-2': size === 'large',
        },
        props.className
      )}
    >
      {props.beats
        .slice(
          Math.floor(
            Math.max(cellNeedWidth * cellCount - containerRect.width, 0) /
              cellNeedWidth
          ),
          cellCount
        )
        .map((beat, i) => (
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
