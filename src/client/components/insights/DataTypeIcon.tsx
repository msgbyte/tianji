import React from 'react';
import {
  LuALargeSmall,
  LuBrackets,
  LuCalendarDays,
  LuHash,
  LuSearch,
  LuToggleLeft,
} from 'react-icons/lu';

export const DataTypeIcon: React.FC<{ type: string | undefined }> = React.memo(
  (props) => {
    if (props.type === 'string') {
      return <LuALargeSmall />;
    }
    if (props.type === 'boolean') {
      return <LuToggleLeft />;
    }
    if (props.type === 'number') {
      return <LuHash />;
    }
    if (props.type === 'date') {
      return <LuCalendarDays />;
    }
    if (props.type === 'array') {
      return <LuBrackets />;
    }

    return <LuSearch />;
  }
);
DataTypeIcon.displayName = 'DataTypeIcon';
