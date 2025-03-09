import { t, useTranslation } from '@i18next-toolkit/react';
import { Input } from '../../ui/input';
import {
  FilterBooleanOperator,
  FilterDateOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterStringOperator,
} from '@tianji/shared';
import React from 'react';
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

export type FilterOperatorMap<T extends string> = Record<
  T,
  {
    label: string;
    component?: (
      value: FilterInfoValue,
      onChange: (val: FilterInfoValue) => void,
      onSubmit: () => void
    ) => React.ReactNode;
  }
>;

interface FilterComponentProps {
  value: FilterInfoValue;
  onChange: (val: FilterInfoValue) => void;
  onSubmit: () => void;
}

export const numberOperators: FilterOperatorMap<
  Exclude<FilterNumberOperator, 'in list' | 'not in list'>
> = {
  equals: {
    label: t('Equals'),
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
      <FilterBetween value={value} onChange={onChange} onSubmit={onSubmit} />
    ),
  },
};

export const stringOperators: FilterOperatorMap<
  Exclude<FilterStringOperator, 'in list' | 'not in list'>
> = {
  equals: {
    label: t('Equals'),
    component: (value, onChange, onSubmit) => (
      <Input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
      />
    ),
  },
  'not equals': {
    label: t('Not equals'),
    component: (value, onChange, onSubmit) => (
      <Input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
      />
    ),
  },
  contains: {
    label: t('Contains'),
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
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
    component: (value, onChange, onSubmit) => (
      <FilterBoolean value={value} onChange={onChange} onSubmit={onSubmit} />
    ),
  },
  'not equals': {
    label: t('Not equals'),
    component: (value, onChange, onSubmit) => (
      <FilterBoolean value={value} onChange={onChange} onSubmit={onSubmit} />
    ),
  },
};

export const dateOperators: FilterOperatorMap<
  Exclude<FilterDateOperator, 'between'>
> = {
  'in day': {
    label: t('in Day'),
    component: (value, onChange, onSubmit) => (
      <FilterDate value={value} onChange={onChange} onSubmit={onSubmit} />
    ),
  },
};

export const defaultOperators: Record<FilterInfoType, string> = {
  string: 'equals',
  number: 'equals',
  boolean: 'equals',
  date: 'in day',
  array: '',
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
