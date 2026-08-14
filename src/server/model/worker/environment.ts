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

type WorkerEnvironmentVariableTransaction = {
  functionWorkerEnvironmentVariable: {
    findMany(args: {
      where: { workerId: string };
    }): Promise<WorkerEnvironmentVariableRow[]>;
    create(args: {
      data: {
        workerId: string;
        key: string;
        type: 'Text' | 'Secret';
        value: string;
      };
    }): Promise<unknown>;
    update(args: {
      where: { id: string; workerId: string };
      data: {
        key: string;
        type: 'Text' | 'Secret';
        value?: string;
      };
    }): Promise<unknown>;
    deleteMany(args: {
      where: { workerId: string; id: { in: string[] } };
    }): Promise<unknown>;
  };
};

export async function syncWorkerEnvironmentVariables(
  tx: WorkerEnvironmentVariableTransaction,
  workerId: string,
  inputs: WorkerEnvironmentVariableInput[]
): Promise<void> {
  const existingRows = await tx.functionWorkerEnvironmentVariable.findMany({
    where: { workerId },
  });
  const existingById = new Map(existingRows.map((row) => [row.id, row]));

  for (const input of inputs) {
    if (!input.id) {
      if (input.value === undefined) {
        throw new Error('A value is required for a new Secret');
      }
      continue;
    }

    const existing = existingById.get(input.id);
    if (!existing) {
      throw new Error('Environment variable not found');
    }
    if (input.type !== existing.type && input.value === undefined) {
      throw new Error('A value is required when changing variable type');
    }
  }

  const submittedIds = new Set(
    inputs.flatMap((input) => (input.id ? [input.id] : []))
  );
  const deletedIds = existingRows
    .filter((row) => !submittedIds.has(row.id))
    .map((row) => row.id);

  if (deletedIds.length > 0) {
    await tx.functionWorkerEnvironmentVariable.deleteMany({
      where: {
        workerId,
        id: { in: deletedIds },
      },
    });
  }

  for (const input of inputs) {
    if (!input.id) {
      if (input.value === undefined) {
        throw new Error('A value is required for a new Secret');
      }

      await tx.functionWorkerEnvironmentVariable.create({
        data: {
          workerId,
          key: input.key,
          type: input.type,
          value: input.value,
        },
      });
      continue;
    }

    const data =
      input.type === 'Secret' && input.value === undefined
        ? { key: input.key, type: input.type }
        : { key: input.key, type: input.type, value: input.value };

    await tx.functionWorkerEnvironmentVariable.update({
      where: { id: input.id, workerId },
      data,
    });
  }
}
