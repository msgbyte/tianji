import { Tag } from 'antd';
import React, { useMemo } from 'react';
import str2int from 'str2int';

const builtinColors = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];

export const ColorTag: React.FC<{ label: string; colors?: string[] }> =
  React.memo((props) => {
    const { label, colors = builtinColors } = props;
    const color = useMemo(
      () => colors[str2int(label) % colors.length],
      [label]
    );

    return <Tag color={color}>{label}</Tag>;
  });
ColorTag.displayName = 'ColorTag';
