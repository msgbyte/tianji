import { z } from 'zod';

export const MonitorStatusPageListSchema = z.array(
  z.object({
    id: z.string(),
    showCurrent: z.boolean().default(false).optional(),
  })
);

export const CommonPayloadSchema = z.record(z.string(), z.any());
