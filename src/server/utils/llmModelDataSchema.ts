import { z } from 'zod';

const nonEmptyRecord = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z
    .record(z.string(), valueSchema)
    .refine(
      (value) => Object.keys(value).length > 0,
      'document must not be empty'
    );

export const llmModelDataV1Schema = nonEmptyRecord(
  z.record(z.string(), z.unknown())
);

export const llmModelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    cost: z
      .object({
        input: z.number().optional(),
        output: z.number().optional(),
      })
      .passthrough()
      .optional(),
    limit: z
      .object({
        context: z.number().optional(),
        output: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const llmProviderSchema = z
  .object({
    name: z.string(),
    models: z.record(z.string(), llmModelSchema),
  })
  .passthrough();

export const llmModelDataV2Schema = nonEmptyRecord(llmProviderSchema);

export function validateCanonicalJson<T>(
  source: string,
  schema: z.ZodType<T>
): T {
  const parsed: unknown = JSON.parse(source);
  const canonical = `${JSON.stringify(parsed, null, 2)}\n`;

  if (source !== canonical) {
    throw new Error(
      'expected canonical two-space JSON with a trailing newline'
    );
  }

  return schema.parse(parsed);
}
