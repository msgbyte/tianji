import { z } from 'zod';

export const CommonPayloadSchema = z.record(z.string(), z.any());

export const MonitorStatusPageListSchema = z.array(
  z.object({
    id: z.string(),
    showCurrent: z.boolean().default(false).optional(),
  })
);

export const SurveyPayloadSchema = z.object({
  items: z.object({
    label: z.string(),
    name: z.string(),
    type: z.enum(['text', 'select', 'email']),
    options: z.array(z.string()).optional(),
  }),
});
