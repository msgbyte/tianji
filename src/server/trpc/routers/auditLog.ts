import { z } from 'zod';
import { router, workspaceProcedure } from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { WorkspaceAuditLogModelSchema } from '../../prisma/zod';
import { prisma } from '../../model/_client';
import { fetchDataByCursor } from '../../utils/prisma';

export const auditLogRouter = router({
  fetchByCursor: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/fetchByCursor',
        tags: [OPENAPI_TAG.WORKSPACE],
        description: 'Fetch workspace audit log',
      },
    })
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
