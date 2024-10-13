import { useTheme } from '@/hooks/useTheme';
import { get } from 'lodash-es';
import React from 'react';
import { useMemo } from 'react';
import { Rectangle } from 'recharts';

export const CustomizedErrorArea: React.FC = (props) => {
  const { colors } = useTheme();
  const y = get(props, 'offset.top', 10);
  const height = get(props, 'offset.height', 160);
  const points = get(props, 'formattedGraphicalItems.0.props.points', []) as {
    x: number;
    y: number | null;
  }[];

  const errorArea = useMemo(() => {
    const _errorArea: { x: number; width: number }[] = [];
    let prevX: number | null = null;
    points.forEach((item, i, arr) => {
      if (i === 0 && !item.y) {
        prevX = 0;
      } else if (!item.y && prevX === null && arr[i - 1].y) {
        prevX = arr[i - 1].x;
      } else if (item.y && prevX !== null) {
        _errorArea.push({
          x: prevX,
          width: item.x - prevX,
        });
        prevX = null;
      }
    });

    return _errorArea;
  }, [points]);

  return errorArea.map((area, i) => {
    return (
      <Rectangle
        key={i}
        width={area.width}
        height={height}
        x={area.x}
        y={y}
        fill={colors.chart.error}
      />
    );
  });
};
CustomizedErrorArea.displayName = 'CustomizedErrorArea';
