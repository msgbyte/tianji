import { z } from 'zod';

export function buildCursorResponseSchema(
  itemSchema: z.ZodType,
  cursorSchema = z.string()
) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: cursorSchema.optional(),
  });
}
