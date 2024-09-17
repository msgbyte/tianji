import { z } from 'zod';

export const leafItemSchema = z.object({
  key: z.string(),
  id: z.string(),
  type: z.enum(['monitor']),
  showCurrent: z.boolean().default(false).optional(),
});

export const groupItemSchema = z.object({
  key: z.string(),
  title: z.string(),
  children: z.array(leafItemSchema),
});

export const bodySchema = z
  .object({
    groups: z.array(groupItemSchema),
  })
  .default({ groups: [] });
