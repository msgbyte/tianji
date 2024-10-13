import { useResizeObserver } from '@/hooks/useResizeObserver';
import { getStatusBgColorClassName, HealthStatus } from '@/utils/health';
import { cn } from '@/utils/style';
import clsx from 'clsx';
import React from 'react';

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
              getStatusBgColorClassName(beat.status)
            )}
          />
        ))}
    </div>
  );
});
HealthBar.displayName = 'HealthBar';
