import { z } from 'zod';

export function buildCursorResponseSchema<T extends z.ZodType>(
  itemSchema: T,
  cursorSchema = z.string()
) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: cursorSchema.optional(),
  });
}
