import React from 'react';
import { sumBy } from 'lodash-es';
import { cn } from '@/utils/style';

export interface BarListItem {
  label: string;
  count: number;
  /**
   * Render as a de-emphasized row, e.g. an aggregated "Other" bucket
   */
  muted?: boolean;
}

/**
 * Ranked list where each row shows its share of the total as a background bar
 */
export const BarList: React.FC<{
  className?: string;
  data: BarListItem[];
  /**
   * Defaults to the sum of all counts
   */
  total?: number;
  labelClassName?: string;
  'aria-label'?: string;
}> = React.memo((props) => {
  const { className, data, labelClassName } = props;
  const total = props.total ?? sumBy(data, 'count');

  return (
    <ul
      aria-label={props['aria-label']}
      className={cn('grid gap-1', className)}
      role="list"
    >
      {data.map((item, index) => {
        const percent = total > 0 ? (item.count / total) * 100 : 0;

        return (
          <li
            key={`${item.label}-${index}`}
            className="hover:bg-muted/40 relative flex h-9 items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 text-sm"
            title={`${item.label}: ${item.count.toLocaleString()}`}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-0 left-0 rounded-md',
                item.muted ? 'bg-muted' : 'bg-blue-500/25'
              )}
              style={{ width: `${percent}%` }}
            />
            <span
              className={cn(
                'relative min-w-0 truncate',
                item.muted ? 'text-muted-foreground' : labelClassName
              )}
            >
              {item.label}
            </span>
            <span className="relative flex shrink-0 gap-1 tabular-nums">
              <span className="w-12 text-right font-semibold">
                {item.count.toLocaleString()}
              </span>
              <span className="text-muted-foreground w-14 text-right">
                {percent.toFixed(1)}%
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
});
BarList.displayName = 'BarList';
