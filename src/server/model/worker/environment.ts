import { z } from 'zod';
import { prisma } from '../_client.js';

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
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (keys.has(item.key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Environment variable keys must be unique',
          path: [index, 'key'],
        });
      }
      keys.add(item.key);

      if (item.id) {
        if (ids.has(item.id)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Environment variable IDs must be unique',
            path: [index, 'id'],
          });
        }
        ids.add(item.id);
      }
    });
  });

export type WorkerEnvironmentVariableInput = z.infer<
  typeof workerEnvironmentVariableInputSchema
>;

export type SafeWorkerEnvironmentVariable =
  | { id: string; key: string; type: 'Text'; value: string }
  | { id: string; key: string; type: 'Secret'; hasValue: boolean };

export type ResolvedWorkerEnvironment = {
  environment: Record<string, string>;
  secretValues: string[];
};

type WorkerEnvironmentVariableRow = {
  id: string;
  key: string;
  type: 'Text' | 'Secret';
  value: string;
};

function validateWorkerEnvironmentInputs(
  existingRows: WorkerEnvironmentVariableRow[],
  inputs: WorkerEnvironmentVariableInput[]
) {
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const submittedIds = new Set<string>();

  for (const input of inputs) {
    if (!input.id) {
      if (input.value === undefined) {
        throw new Error('A value is required for a new Secret');
      }
      continue;
    }
    if (submittedIds.has(input.id)) {
      throw new Error('Environment variable IDs must be unique');
    }
    submittedIds.add(input.id);

    const existing = existingById.get(input.id);
    if (!existing) {
      throw new Error('Environment variable not found');
    }
    if (input.type !== existing.type && input.value === undefined) {
      throw new Error('A value is required when changing variable type');
    }
  }

  return existingById;
}

function reserveTemporaryEnvironmentKey(
  rowId: string,
  occupiedKeys: Set<string>
) {
  const base = `__tianji_environment_staging__:${rowId}`;
  let candidate = base;
  let suffix = 0;

  while (occupiedKeys.has(candidate)) {
    suffix += 1;
    candidate = `${base}:${suffix}`;
  }

  occupiedKeys.add(candidate);
  return candidate;
}

export async function loadWorkerEnvironment(
  workerId: string
): Promise<Record<string, string>> {
  const rows = await prisma.functionWorkerEnvironmentVariable.findMany({
    where: { workerId },
    select: { key: true, value: true },
  });

  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

export async function loadWorkerEnvironmentForExecution(
  workerId: string
): Promise<ResolvedWorkerEnvironment> {
  const rows = await prisma.functionWorkerEnvironmentVariable.findMany({
    where: { workerId },
    select: { key: true, type: true, value: true },
  });

  return {
    environment: Object.fromEntries(
      rows.map(({ key, value }) => [key, value])
    ),
    secretValues: rows.flatMap(({ type, value }) =>
      type === 'Secret' && value.length > 0 ? [value] : []
    ),
  };
}

export async function resolveWorkerEnvironmentForExecution(
  workerId?: string,
  drafts?: WorkerEnvironmentVariableInput[]
): Promise<ResolvedWorkerEnvironment> {
  if (drafts === undefined) {
    return workerId
      ? loadWorkerEnvironmentForExecution(workerId)
      : { environment: {}, secretValues: [] };
  }

  const existingRows: WorkerEnvironmentVariableRow[] = workerId
    ? await prisma.functionWorkerEnvironmentVariable.findMany({
        where: { workerId },
      })
    : [];
  const existingById = validateWorkerEnvironmentInputs(existingRows, drafts);
  const resolved = drafts.map((draft) => ({
    key: draft.key,
    type: draft.type,
    value:
      draft.value === undefined
        ? (existingById.get(draft.id as string)?.value as string)
        : draft.value,
  }));

  return {
    environment: Object.fromEntries(
      resolved.map(({ key, value }) => [key, value])
    ),
    secretValues: resolved.flatMap(({ type, value }) =>
      type === 'Secret' && value.length > 0 ? [value] : []
    ),
  };
}

export async function resolveWorkerEnvironment(
  workerId?: string,
  drafts?: WorkerEnvironmentVariableInput[]
): Promise<Record<string, string>> {
  const { environment } = await resolveWorkerEnvironmentForExecution(
    workerId,
    drafts
  );
  return environment;
}

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
  const existingById = validateWorkerEnvironmentInputs(existingRows, inputs);

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

  const occupiedKeys = new Set(existingRows.map((row) => row.key));
  for (const input of inputs) {
    if (!input.id) {
      continue;
    }

    const existing = existingById.get(input.id) as WorkerEnvironmentVariableRow;
    if (existing.key === input.key) {
      continue;
    }

    const temporaryKey = reserveTemporaryEnvironmentKey(
      existing.id,
      occupiedKeys
    );
    await tx.functionWorkerEnvironmentVariable.update({
      where: { id: existing.id, workerId },
      data: { key: temporaryKey, type: existing.type },
    });
    occupiedKeys.delete(existing.key);
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
