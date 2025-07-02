import { t, useTranslation } from '@i18next-toolkit/react';
import { Input } from '../../ui/input';
import {
  FilterBooleanOperator,
  FilterDateOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterOperator,
  FilterStringOperator,
} from '@tianji/shared';
import React, { useMemo } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/utils/style';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { LuCalendar } from 'react-icons/lu';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import { useInsightsStore } from '@/store/insights';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { MultiSelectPopover } from '../MultiSelectPopover';

export type FilterOperatorMap<T extends string> = Record<
  T,
  {
    label: string;
    component?: (
      name: string,
      value: FilterInfoValue,
      onChange: (val: FilterInfoValue) => void,
      onSubmit: () => void
    ) => React.ReactNode;
  }
>;

interface FilterComponentProps {
  name: string;
  value: FilterInfoValue;
  onChange: (val: FilterInfoValue) => void;
  onSubmit: (val?: FilterInfoValue) => void;
}

export const numberOperators: FilterOperatorMap<
  Exclude<FilterNumberOperator, 'in list' | 'not in list'>
> = {
  equals: {
    label: t('Equals'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  'not equals': {
    label: t('Not equals'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  'greater than': {
    label: t('Greater Than'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  'less than': {
    label: t('Less Than'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  'greater than or equal': {
    label: t('Greater than or Equal'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  'less than or equal': {
    label: t('Less than or Equal'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onSubmit}
      />
    ),
  },
  between: {
    label: t('Between'),
    component: (name, value, onChange, onSubmit) => (
      <FilterBetween
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
};

export const stringOperators: FilterOperatorMap<
  Exclude<FilterStringOperator, 'in list' | 'not in list'>
> = {
  equals: {
    label: t('Equals'),
    component: (name, value, onChange, onSubmit) => (
      <FilterInputWithReference
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
  'not equals': {
    label: t('Not equals'),
    component: (name, value, onChange, onSubmit) => (
      <FilterInputWithReference
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
  contains: {
    label: t('Contains'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
      />
    ),
  },
  'not contains': {
    label: t('Not contains'),
    component: (name, value, onChange, onSubmit) => (
      <Input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
      />
    ),
  },
};

export const booleanOperators: FilterOperatorMap<FilterBooleanOperator> = {
  equals: {
    label: t('Equals'),
    component: (name, value, onChange, onSubmit) => (
      <FilterBoolean
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
  'not equals': {
    label: t('Not equals'),
    component: (name, value, onChange, onSubmit) => (
      <FilterBoolean
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
};

export const dateOperators: FilterOperatorMap<
  Exclude<FilterDateOperator, 'between'>
> = {
  'in day': {
    label: t('in Day'),
    component: (name, value, onChange, onSubmit) => (
      <FilterDate
        name={name}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    ),
  },
};

export const defaultOperators: Record<FilterInfoType, FilterOperator> = {
  string: 'equals',
  number: 'equals',
  boolean: 'equals',
  date: 'in day',
  array: 'in list',
};

const FilterBetween: React.FC<FilterComponentProps> = React.memo((props) => {
  const value = Array.isArray(props.value) ? props.value : [];

  const handleSubmit = useEvent(() => {
    if (
      value.length === 2 &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'number'
    ) {
      props.onSubmit();
    }
  });

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={Number(value[0])}
        onChange={(e) =>
          props.onChange([Number(e.target.value), Number(value[1])])
        }
        onBlur={handleSubmit}
      />

      <span> and </span>

      <Input
        type="number"
        value={Number(value[1])}
        onChange={(e) =>
          props.onChange([Number(value[0]), Number(e.target.value)])
        }
        onBlur={handleSubmit}
      />
    </div>
  );
});
FilterBetween.displayName = 'FilterBetween';

const FilterBoolean: React.FC<FilterComponentProps> = React.memo((props) => {
  return (
    <RadioGroup
      defaultValue="true"
      value={String(Boolean(props.value))}
      onValueChange={(value) => {
        props.onChange(Number(value === 'true'));
        props.onSubmit();
      }}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="true" />
        <Label>True</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="false" />
        <Label>False</Label>
      </div>
    </RadioGroup>
  );
});
FilterBoolean.displayName = 'FilterBoolean';

const FilterDate: React.FC<FilterComponentProps> = React.memo((props) => {
  const [date, setDate] = React.useState<Date>(() =>
    props.value ? new Date(String(props.value)) : new Date()
  );

  const { t } = useTranslation();

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          props.onSubmit();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !props.value && 'text-muted-foreground'
          )}
        >
          <LuCalendar className="mr-2 h-4 w-4" />
          {date ? (
            dayjs(date).format('MMM D, YYYY')
          ) : (
            <span>{t('Pick a date')}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(day) => {
            const date = day ? day : new Date();

            setDate(date);
            props.onChange(date.toISOString());
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});
FilterDate.displayName = 'FilterDate';

const FilterInputWithReference: React.FC<FilterComponentProps> = React.memo(
  (props) => {
    const insightId = useInsightsStore((state) => state.insightId);
    const insightType = useInsightsStore((state) => state.insightType);
    const workspaceId = useCurrentWorkspaceId();

    const { data: referenceValues = [] } =
      trpc.insights.filterParamValues.useQuery(
        {
          workspaceId,
          insightId,
          insightType,
          paramName: props.name,
        },
        {
          enabled: !!insightId && !!insightType && !!props.name,
        }
      );

    // Convert reference values to options format
    const options = referenceValues.map((value) => ({
      value: String(value),
      label: String(value),
    }));

    // Handle current value - convert to array format for MultiSelectPopover
    const selectedValues = useMemo(() => {
      if (Array.isArray(props.value)) {
        return props.value.map(String);
      }

      return props.value ? [String(props.value)] : [];
    }, [props.value]);

    const handleValueChange = useEvent((values: string[]) => {
      const value = values.length > 0 ? values[0] : '';

      props.onSubmit(value);
    });

    return (
      <MultiSelectPopover
        options={options}
        selectedValues={selectedValues}
        onValueChange={handleValueChange}
        allowCustomInput={true}
        singleSelect={true}
        showSelectAll={false}
      />
    );
  }
);
FilterInputWithReference.displayName = 'FilterInputWithReference';
