import { z } from 'zod';

export const dateUnitSchema = z.enum([
  'minute',
  'hour',
  'day',
  'month',
  'year',
]);

const FilterInfoValue = z.union([
  z.string(),
  z.number(),
  z.string().array(),
  z.number().array(),
]);

const FilterInfoSchema = z.object({
  name: z.string(),
  operator: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array']),
  value: FilterInfoValue.nullable(),
});

export const insightsQuerySchema = z.object({
  websiteId: z.string(),
  metrics: z.array(
    z.object({
      name: z.string(),
      math: z.enum(['events', 'sessions']).default('events'),
    })
  ),
  filters: z.array(FilterInfoSchema),
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
