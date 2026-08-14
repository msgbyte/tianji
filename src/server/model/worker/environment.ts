import { z } from 'zod';

const environmentKeySchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Invalid environment variable key');

export const workerEnvironmentVariableInputSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().cuid2().optional(),
    key: environmentKeySchema,
    type: z.literal('Text'),
    value: z.string(),
  }),
  z.object({
    id: z.string().cuid2().optional(),
    key: environmentKeySchema,
    type: z.literal('Secret'),
    value: z.string().optional(),
  }),
]);

export const workerEnvironmentVariablesInputSchema = z
  .array(workerEnvironmentVariableInputSchema)
  .superRefine((items, ctx) => {
    const keys = new Set<string>();
    items.forEach((item, index) => {
      if (keys.has(item.key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Environment variable keys must be unique',
          path: [index, 'key'],
        });
      }
      keys.add(item.key);
    });
  });

export type WorkerEnvironmentVariableInput = z.infer<
  typeof workerEnvironmentVariableInputSchema
>;

export type SafeWorkerEnvironmentVariable =
  | { id: string; key: string; type: 'Text'; value: string }
  | { id: string; key: string; type: 'Secret'; hasValue: boolean };

type WorkerEnvironmentVariableRow = {
  id: string;
  key: string;
  type: 'Text' | 'Secret';
  value: string;
};

export function toSafeWorkerEnvironmentVariable(
  row: WorkerEnvironmentVariableRow
): SafeWorkerEnvironmentVariable {
  if (row.type === 'Text') {
    return {
      id: row.id,
      key: row.key,
      type: 'Text',
      value: row.value,
    };
  }

  return {
    id: row.id,
    key: row.key,
    type: 'Secret',
    hasValue: true,
  };
}
