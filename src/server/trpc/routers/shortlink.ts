import {
  router,
  workspaceProcedure,
  workspaceAdminProcedure,
} from '../trpc.js';
import { z } from 'zod';
import {
  createShortLink,
  deleteShortLink,
  getShortLink,
  getShortLinkAccessStats,
  getWorkspaceShortLinks,
  updateShortLink,
} from '../../model/shortlink.js';
import { ShortLinkModelSchema } from '../../prisma/zod/index.js';
import { createAuditLog } from '../../model/auditLog.js';
import { ShortLinkType } from '@prisma/client';

export const shortlinkRouter = router({
  /**
   * Get all short links for current workspace
   */
  all: workspaceProcedure
    .output(z.array(ShortLinkModelSchema))
    .query(async ({ input }) => {
      const workspaceId = input.workspaceId;
      const shortLinks = await getWorkspaceShortLinks(workspaceId);
      return shortLinks;
    }),

  /**
   * Get single short link by id
   */
  get: workspaceProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
      })
    )
    .output(ShortLinkModelSchema.nullable())
    .query(async ({ input }) => {
      const { workspaceId, id } = input;
      const shortLink = await getShortLink(workspaceId, id);
      return shortLink;
    }),

  /**
   * Create a new short link
   */
  create: workspaceAdminProcedure
    .input(
      z.object({
        originalUrl: z.string().url(),
        code: z.string().max(50).optional(),
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        type: z.nativeEnum(ShortLinkType).optional(),
      })
    )
    .output(ShortLinkModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, originalUrl, code, title, description, type } =
        input;

      const shortLink = await createShortLink({
        workspaceId,
        originalUrl,
        code,
        title,
        description,
        type,
      });

      await createAuditLog({
        workspaceId,
        content: `Create short link: ${shortLink.code}`,
      });

      return shortLink;
    }),

  /**
   * Update a short link
   */
  update: workspaceAdminProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        originalUrl: z.string().url().optional(),
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .output(z.object({ count: z.number() }))
    .mutation(async ({ input }) => {
      const { workspaceId, id, originalUrl, title, description, enabled } =
        input;

      const result = await updateShortLink({
        workspaceId,
        id,
        originalUrl,
        title,
        description,
        enabled,
      });

      await createAuditLog({
        workspaceId,
        content: `Update short link: ${id}`,
      });

      return { count: result.count };
    }),

  /**
   * Delete a short link (soft delete)
   */
  delete: workspaceAdminProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
      })
    )
    .output(z.object({ count: z.number() }))
    .mutation(async ({ input }) => {
      const { workspaceId, id } = input;

      const result = await deleteShortLink(workspaceId, id);

      await createAuditLog({
        workspaceId,
        content: `Delete short link: ${id}`,
      });

      return { count: result.count };
    }),

  /**
   * Get access statistics for a short link
   */
  stats: workspaceProcedure
    .input(
      z.object({
        shortLinkId: z.string().cuid2(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .output(
      z.object({
        totalAccesses: z.number(),
        accessesByCountry: z.array(
          z.object({
            country: z.string().nullable(),
            _count: z.object({
              country: z.number(),
            }),
          })
        ),
        accessesByBrowser: z.array(
          z.object({
            browser: z.string().nullable(),
            _count: z.object({
              browser: z.number(),
            }),
          })
        ),
        accessesByDevice: z.array(
          z.object({
            device: z.string().nullable(),
            _count: z.object({
              device: z.number(),
            }),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId, shortLinkId, startDate, endDate } = input;

      const stats = await getShortLinkAccessStats(
        workspaceId,
        shortLinkId,
        startDate,
        endDate
      );

      return stats;
    }),
});
