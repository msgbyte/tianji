import { Tag } from 'antd';
import React, { useMemo } from 'react';
import str2int from 'str2int';
import { Badge } from './ui/badge';
import { cn } from '@/utils/style';

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

/**
 * @deprecated Use ColorTagV2 instead
 */
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

const builtinColorsV2 = [
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-purple-100 text-purple-800 border-purple-200',
];

export const ColorTagV2: React.FC<{ label: string; className?: string }> =
  React.memo(({ label, className }) => {
    const colorClass = useMemo(
      () => builtinColorsV2[str2int(label) % builtinColorsV2.length],
      [label]
    );

    return (
      <Badge
        variant="outline"
        className={cn(colorClass, 'text-xs font-medium', className)}
      >
        {label}
      </Badge>
    );
  });
ColorTagV2.displayName = 'ColorTagV2';
