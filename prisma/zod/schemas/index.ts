import { z } from 'zod';

export const MonitorStatusPageListSchema = z.array(
  z.object({
    id: z.string(),
  })
);
