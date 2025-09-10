import React from 'react';
import { AreaChart, Area } from 'recharts';
import { ChartContainer } from '../ui/chart';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '@/utils/style';

export interface SparklineProps {
  /**
   * Array of numbers to display in the sparkline
   */
  data: number[];
  /**
   * CSS class name for styling
   */
  className?: string;
  /**
   * Width of the sparkline chart
   * @default 100
   */
  width?: number;
  /**
   * Height of the sparkline chart
   * @default 40
   */
  height?: number;
  /**
   * Color of the line and fill area
   */
  color?: string;
  /**
   * Whether to show gradient fill
   * @default true
   */
  showGradient?: boolean;
  /**
   * Stroke width of the line
   * @default 2
   */
  strokeWidth?: number;
  /**
   * Fill opacity of the area
   * @default 0.2
   */
  fillOpacity?: number;
}

export const Sparkline: React.FC<SparklineProps> = React.memo((props) => {
  const {
    data,
    className,
    width = 100,
    height = 40,
    color,
    showGradient = true,
    strokeWidth = 2,
    fillOpacity = 0.2,
  } = props;

  const { colors } = useTheme();

  // Transform number array into chart data format
  const chartData = React.useMemo(() => {
    return data.map((value, index) => ({
      index,
      value,
    }));
  }, [data]);

  // Use theme color if no color provided
  const lineColor = color || colors.chart.default;

  const gradientId = `sparkline-gradient-${React.useId()}`;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ChartContainer config={{}} className="h-full w-full">
        <AreaChart
          data={chartData}
          width={width}
          height={height}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={lineColor}
                  stopOpacity={fillOpacity * 2}
                />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={strokeWidth}
            fill={showGradient ? `url(#${gradientId})` : lineColor}
            fillOpacity={showGradient ? 1 : fillOpacity}
            dot={false}
            activeDot={false}
            isAnimationActive={true}
            animationDuration={300}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
});

Sparkline.displayName = 'Sparkline';
