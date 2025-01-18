import { z } from 'zod';

export const dateUnitSchema = z.enum([
  'minute',
  'hour',
  'day',
  'month',
  'year',
]);

export const insightsQuerySchema = z.object({
  websiteId: z.string(),
  metrics: z.array(
    z.object({
      name: z.string(),
      math: z.enum(['events', 'sessions']).default('events'),
    })
  ),
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
