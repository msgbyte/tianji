import { z } from 'zod';

export const dateUnitSchema = z.enum([
  'minute',
  'hour',
  'day',
  'month',
  'year',
]);

const FilterOperator = z.enum([
  'equals',
  'not equals',
  'in list',
  'not in list',
  'greater than',
  'greater than or equal',
  'less than',
  'less than or equal',
  'between',
  'contains',
  'not contains',
  'in day',
]);

export const FilterType = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'array',
]);

const FilterInfoValue = z.union([
  z.string(),
  z.number(),
  z.string().array(),
  z.number().array(),
]);

const FilterInfoSchema = z.object({
  name: z.string(),
  operator: FilterOperator,
  type: FilterType,
  value: FilterInfoValue.nullable(),
});

export const insightsQuerySchema = z.object({
  insightId: z.string(),
  insightType: z.enum(['website', 'survey', 'aigateway']),
  metrics: z.array(
    z.object({
      name: z.string(),
      math: z.enum(['events', 'sessions']).default('events'),
    })
  ),
  filters: z.array(FilterInfoSchema).default([]),
  groups: z
    .object({
      value: z.string(),
      type: FilterType,
      customGroups: z
        .object({
          filterOperator: FilterOperator,
          filterValue: FilterInfoValue,
        })
        .array()
        .optional(),
    })
    .array()
    .default([]),
  time: z.object({
    startAt: z.number(),
    endAt: z.number(),
    unit: dateUnitSchema,
    timezone: z.string().optional(),
  }),
});

export function buildCursorResponseSchema<T extends z.ZodType>(
  itemSchema: T,
  cursorSchema = z.string()
) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: cursorSchema.optional(),
  });
}
