import { z } from 'zod';
import { OpenApiMetaInfo, router, workspaceProcedure } from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { WorkspaceAuditLogModelSchema } from '../../prisma/zod';
import { prisma } from '../../model/_client';
import { fetchDataByCursor } from '../../utils/prisma';
import { OpenApiMeta } from 'trpc-openapi';

export const auditLogRouter = router({
  fetchByCursor: workspaceProcedure
    .meta(
      buildAuditLogOpenapi({
        method: 'GET',
        path: '/fetchByCursor',
        description: 'Fetch workspace audit log',
      })
    )
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .output(
      z.object({
        items: z.array(WorkspaceAuditLogModelSchema),
        nextCursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId, cursor, limit } = input;

      const { items, nextCursor } = await fetchDataByCursor(
        prisma.workspaceAuditLog,
        {
          where: {
            workspaceId,
          },
          limit,
          cursor,
        }
      );

      return {
        items,
        nextCursor,
      };
    }),
});

function buildAuditLogOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.AUDIT_LOG],
      protect: true,
      ...meta,
      path: `/audit${meta.path}`,
    },
  };
}
