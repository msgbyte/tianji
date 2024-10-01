/**
 * Reference: https://bit.cloud/teambit/analytics/hooks/use-recharts-line-stroke-dasharray
 */

import { useCallback, useRef } from 'react';

type GraphicalItemPoint = {
  /**
   * x point coordinate.
   */
  x?: number;
  /**
   * y point coordinate.
   */
  y?: number;
};

type GraphicalItemProps = {
  /**
   * graphical item points.
   */
  points?: GraphicalItemPoint[];
};

type ItemProps = {
  /**
   * item data key.
   */
  dataKey?: string;
};

type ItemType = {
  /**
   * recharts item display name.
   */
  displayName?: string;
};

type Item = {
  /**
   * item props.
   */
  props?: ItemProps;
  /**
   * recharts item class.
   */
  type?: ItemType;
};

type GraphicalItem = {
  /**
   * from recharts internal state and props of chart.
   */
  props?: GraphicalItemProps;
  /**
   * from recharts internal state and props of chart.
   */
  item?: Item;
};

type RechartsChartProps = {
  /**
   * from recharts internal state and props of chart.
   */
  formattedGraphicalItems?: GraphicalItem[];
};

type CalculateStrokeDasharray = (props?: any) => any;

type LineStrokeDasharray = {
  /**
   * line name.
   */
  name?: string;
  /**
   * line strokeDasharray.
   */
  strokeDasharray?: string;
};

type LinesStrokeDasharray = LineStrokeDasharray[];

type LineProps = {
  /**
   * line name.
   */
  name?: string;
  /**
   * specifies the starting index of the first dot in the dash pattern.
   */
  dotIndex?: number;
  /**
   * defines the pattern of dashes and gaps. an array of [gap length, dash length].
   */
  strokeDasharray?: [number, number];
  /**
   * adjusts the percentage correction of the first line segment for better alignment in curved lines.
   */
  curveCorrection?: number;
};

export type UseStrokeDasharrayProps = {
  /**
   * an array of properties to target specific line(s) and override default settings.
   */
  linesProps?: LineProps[];
} & LineProps;

export function useStrokeDasharray({
  linesProps = [],
  dotIndex = -2,
  strokeDasharray: restStroke = [5, 3],
  curveCorrection = 1,
}: UseStrokeDasharrayProps): [CalculateStrokeDasharray, LinesStrokeDasharray] {
  const linesStrokeDasharray = useRef<LinesStrokeDasharray>([]);

  const calculateStrokeDasharray = useCallback(
    (props: RechartsChartProps): null => {
      const items = props?.formattedGraphicalItems;

      const getLineWidth = (points: GraphicalItemPoint[]) => {
        const width = points?.reduce((acc, point, index) => {
          if (!index) return acc;

          const prevPoint = points?.[index - 1];

          const xAxis = point?.x || 0;
          const prevXAxis = prevPoint?.x || 0;
          const xWidth = xAxis - prevXAxis;

          const yAxis = point?.y || 0;
          const prevYAxis = prevPoint?.y || 0;
          const yWidth = Math.abs(yAxis - prevYAxis);

          const hypotenuse = Math.sqrt(xWidth * xWidth + yWidth * yWidth);
          acc += hypotenuse;
          return acc;
        }, 0);

        return width || 0;
      };

      items?.forEach((line) => {
        const linePoints = line?.props?.points ?? [];
        const lineWidth = getLineWidth(linePoints);

        const name = line?.item?.props?.dataKey;
        const targetLine = linesProps?.find((target) => target?.name === name);
        const targetIndex = targetLine?.dotIndex ?? dotIndex;
        const dashedPoints = linePoints?.slice(targetIndex);
        const dashedWidth = getLineWidth(dashedPoints);

        if (!lineWidth || !dashedWidth) return;

        const firstWidth = lineWidth - dashedWidth;
        const targetCurve = targetLine?.curveCorrection ?? curveCorrection;
        const correctionWidth = (firstWidth * targetCurve) / 100;
        const firstDasharray = firstWidth + correctionWidth;

        const targetRestStroke = targetLine?.strokeDasharray || restStroke;
        const gapDashWidth = targetRestStroke?.[0] + targetRestStroke?.[1] || 1;
        const restDasharrayLength = dashedWidth / gapDashWidth;
        const restDasharray = new Array(Math.ceil(restDasharrayLength)).fill(
          targetRestStroke.join(' ')
        );

        const strokeDasharray = `${firstDasharray} ${restDasharray.join(' ')}`;
        const lineStrokeDasharray = { name, strokeDasharray };

        const dasharrayIndex = linesStrokeDasharray.current.findIndex((d) => {
          return d.name === line?.item?.props?.dataKey;
        });

        if (dasharrayIndex === -1) {
          linesStrokeDasharray.current.push(lineStrokeDasharray);
          return;
        }

        linesStrokeDasharray.current[dasharrayIndex] = lineStrokeDasharray;
      });

      return null;
    },
    [dotIndex]
  );

  return [calculateStrokeDasharray, linesStrokeDasharray.current];
}
