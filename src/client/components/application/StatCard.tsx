import { cn } from '@/utils/style';
import React from 'react';
import { LuArrowUp, LuArrowDown } from 'react-icons/lu';

interface StatCardProps {
  label: string;
  curr: number;
  diff: number;
  formatter?: (value: number) => string;
  className?: string;
  borderRight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = React.memo((props) => {
  const {
    label,
    curr,
    diff,
    formatter,
    className = '',
    borderRight = true,
  } = props;

  return (
    <div
      className={cn(
        'flex-1 border-b p-4',
        borderRight && 'border-border border-r',
        className
      )}
    >
      <div className="flex flex-col">
        <span className="text-muted-foreground text-sm">{label}</span>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-2xl font-bold">
            {formatter ? formatter(curr) : curr.toLocaleString()}
          </span>
          {diff !== 0 && (
            <div
              className={`flex items-center ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {diff > 0 ? (
                <LuArrowUp className="mr-1" />
              ) : (
                <LuArrowDown className="mr-1" />
              )}
              <span>
                {formatter ? formatter(diff) : Math.abs(diff).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';
