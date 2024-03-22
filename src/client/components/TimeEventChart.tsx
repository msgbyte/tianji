import { useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { DateUnit } from '@tianji/shared';
import React from 'react';
import { formatDate, formatDateWithUnit } from '../utils/date';
import { Column, ColumnConfig } from '@ant-design/charts';

export const TimeEventChart: React.FC<{
  data: { x: string; y: number; type: string }[];
  unit: DateUnit;
}> = React.memo((props) => {
  const { colors } = useTheme();

  const config = useMemo(
    () =>
      ({
        data: props.data,
        isStack: true,
        xField: 'x',
        yField: 'y',
        seriesField: 'type',
        label: {
          position: 'middle' as const,
          style: {
            fill: '#FFFFFF',
            opacity: 0.6,
          },
        },
        tooltip: {
          title: (t) => formatDate(t),
        },
        color: [colors.chart.pv, colors.chart.uv],
        xAxis: {
          label: {
            autoHide: true,
            autoRotate: false,
            formatter: (text) => formatDateWithUnit(text, props.unit),
          },
        },
      }) satisfies ColumnConfig,
    [props.data, props.unit]
  );

  return <Column {...config} />;
});
TimeEventChart.displayName = 'TimeEventChart';
