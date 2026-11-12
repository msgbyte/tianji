import { Prisma, type ApplicationUser } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../_client.js';
import { flattenJSON } from '../../utils/common.js';
import { DATA_TYPE } from '../../utils/const.js';

export const APPLICATION_USERS_MAX_PAGE = 1_000_000;

export const applicationUserFilterSchema = z.object({
  field: z.string().min(1).max(500),
  value: z.union([z.boolean(), z.string().max(500), z.number(), z.null()]),
});

const userIdSchema = z
  .string()
  .min(1)
  .max(500)
  .refine((id) => id.trim().length > 0);

export function upsertApplicationUser(
  applicationId: string,
  data: Record<string, unknown>
) {
  const identity = data.id ?? data.userId;
  if (identity === undefined || identity === null) return null;
  const userId = userIdSchema.parse(identity);
  const properties = Object.fromEntries(
    flattenJSON(data).map(({ key, value, dynamicDataType }) => [
      key,
      dynamicDataType === DATA_TYPE.boolean
        ? value === 'true'
        : dynamicDataType === DATA_TYPE.array
          ? JSON.parse(value)
          : value,
    ])
  );

  // Merge in SQL so concurrent updates to different fields cannot overwrite each other.
  return prisma.$executeRaw`
    INSERT INTO "ApplicationUser" ("applicationId", "userId", properties, "updatedAt")
    VALUES (${applicationId}, ${userId}, ${JSON.stringify(properties)}::jsonb, NOW())
    ON CONFLICT ("applicationId", "userId") DO UPDATE
    SET properties = "ApplicationUser".properties || EXCLUDED.properties,
        "updatedAt" = EXCLUDED."updatedAt"
  `;
}

async function assertApplicationAccess(
  workspaceId: string,
  applicationId: string
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!application) throw new TRPCError({ code: 'NOT_FOUND' });
}

export async function getApplicationUserFields(
  workspaceId: string,
  applicationId: string
) {
  await assertApplicationAccess(workspaceId, applicationId);
  // shortcut: Sample recent profiles; revisit if manual field entry cannot cover missing suggestions.
  const fields = await prisma.$queryRaw<{ field: string }[]>`
    SELECT DISTINCT jsonb_object_keys(properties) AS field
    FROM (
      SELECT properties FROM "ApplicationUser"
      WHERE "applicationId" = ${applicationId}
      ORDER BY "updatedAt" DESC
      LIMIT 1000
    ) AS recent_users
    ORDER BY field
  `;
  return fields.map(({ field }) => field).filter(Boolean);
}

export async function getApplicationUsers(input: {
  workspaceId: string;
  applicationId: string;
  page: number;
  pageSize: number;
  filter?: z.infer<typeof applicationUserFilterSchema>;
}) {
  const { workspaceId, applicationId, page, pageSize, filter } = input;
  await assertApplicationAccess(workspaceId, applicationId);
  const where = Prisma.sql`"applicationId" = ${applicationId} ${
    filter
      ? Prisma.sql`AND properties @> ${JSON.stringify({ [filter.field]: filter.value })}::jsonb`
      : Prisma.empty
  }`;
  const [items, counts, identifiedTotal] = await prisma.$transaction(
    [
      prisma.$queryRaw<ApplicationUser[]>`
      SELECT * FROM "ApplicationUser" WHERE ${where}
      ORDER BY "updatedAt" DESC, "userId" ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `,
      prisma.$queryRaw<
        { total: bigint }[]
      >`SELECT COUNT(*) AS total FROM "ApplicationUser" WHERE ${where}`,
      prisma.applicationUser.count({ where: { applicationId } }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );

  const total = Number(counts[0].total);
  return {
    items,
    total,
    identifiedTotal,
    totalPages: Math.min(
      APPLICATION_USERS_MAX_PAGE,
      Math.ceil(total / pageSize)
    ),
  };
}
