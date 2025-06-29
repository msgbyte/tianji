import { z } from 'zod';

export const CommonPayloadSchema = z.record(z.string(), z.any());

export const MonitorStatusPageListSchema = z.array(
  z.object({
    id: z.string(),
    showCurrent: z.boolean().default(false).optional(),
    showDetail: z.boolean().default(true).optional(),
  })
);

export const SurveyPayloadSchema = z.object({
  items: z.array(
    z.object({
      label: z.string(),
      name: z.string(),
      type: z.enum(['text', 'select', 'email', 'imageUrl']),
      options: z.array(z.string()).optional(),
    })
  ),
});

export const StatusPageIncidentPayloadSchema = z.object({
  history: z.array(
    z.object({
      message: z.string(),
      timestamp: z.number(),
      status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
      components: z.array(
        z.object({
          id: z.string(),
          type: z.enum(['website', 'monitor']),
          status: z.enum([
            'operational',
            'degradedPerformance',
            'partialOutage',
            'majorOutage',
            'underMaintenance',
          ]),
        })
      ),
    })
  ),
});
