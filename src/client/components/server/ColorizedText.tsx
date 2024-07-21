import { cn } from '@/utils/style';
import React, { PropsWithChildren } from 'react';

interface ColorizedTextProps extends PropsWithChildren {
  className?: string;
  percent: number;
}
export const ColorizedText: React.FC<ColorizedTextProps> = React.memo(
  (props) => {
    return (
      <span
        className={cn(props.className, {
          'text-yellow-500': props.percent > 0.8,
          'text-red-600': props.percent >= 0.9,
          'text-red-900': props.percent >= 0.99,
        })}
      >
        {props.children}
      </span>
    );
  }
);
ColorizedText.displayName = 'ColorizedText';
