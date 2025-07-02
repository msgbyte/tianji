import React, { useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { FilterInfo, FilterInfoValue, FilterOperator } from '@tianji/shared';
import {
  booleanOperators,
  dateOperators,
  FilterOperatorMap,
  numberOperators,
  stringOperators,
} from './utils/filterOperator';
import { cn } from '@/utils/style';
import { isNil } from 'lodash-es';

interface FilterParamsOperatorProps {
  info: FilterInfo;
  onSelect: (info: FilterInfo) => void;
}
export const FilterParamsOperator: React.FC<FilterParamsOperatorProps> =
  React.memo((props) => {
    const { info, onSelect } = props;
    const [value, setValue] = useState(info.value ?? '');
    const isDirtyRef = useRef(false);

    const handleChange = (value: FilterInfoValue) => {
      setValue(value);
      isDirtyRef.current = true;
    };

    const handleSubmit = (_value?: FilterInfoValue) => {
      if (!isNil(_value)) {
        setValue(_value);
        onSelect({
          ...info,
          value: _value,
        });
      } else if (isDirtyRef.current === true) {
        onSelect({
          ...info,
          value,
        });
      }

      isDirtyRef.current = false;
    };

    const operators: FilterOperatorMap<FilterOperator> = useMemo(() => {
      if (info.type === 'number') {
        return numberOperators;
      }

      if (info.type === 'string') {
        return stringOperators;
      }

      if (info.type === 'boolean') {
        return booleanOperators;
      }

      if (info.type === 'date') {
        return dateOperators;
      }

      return {} as any;
    }, [info.type]);

    return (
      <div>
        <div className="flex">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button className="text-xs" variant="ghost" size="sm">
                {operators[info.operator]?.label ?? ''}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.keys(operators).map((operator) => {
                return (
                  <DropdownMenuItem
                    key={operator}
                    className={cn(info.operator === operator && 'bg-muted')}
                    onClick={() => {
                      onSelect({
                        ...info,
                        operator: operator as FilterOperator,
                      });
                    }}
                  >
                    {operators[operator as FilterOperator]?.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {operators[info.operator]?.component && (
            <div className="flex-1">
              {operators[info.operator]?.component?.(
                info.name,
                value,
                handleChange,
                handleSubmit
              )}
            </div>
          )}
        </div>
      </div>
    );
  });
FilterParamsOperator.displayName = 'FilterParamsOperator';
