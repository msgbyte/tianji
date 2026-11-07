import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../../model/_client.js';
import { createWorkspaceMutationAuditLog } from '../../model/auditLog.js';
import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
  workspaceWriteProcedure,
} from '../trpc.js';

const artifactIdInput = z.object({ artifactId: z.cuid2() });
const contentInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  source: z
    .string()
    .refine((source) => source.trim().length > 0, 'HTML must not be empty')
    .refine(
      (source) => Buffer.byteLength(source, 'utf8') <= 1024 * 1024,
      'HTML must be at most 1 MiB in UTF-8'
    ),
});
const metadataSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  description: z.string(),
  revision: z.number().int(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  createdBy: z
    .object({
      id: z.string(),
      username: z.string(),
      nickname: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  path: z.string(),
});
const metadataSelect = {
  id: true,
  workspaceId: true,
  title: true,
  description: true,
  revision: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, username: true, nickname: true } },
} as const satisfies Prisma.ArtifactSelect;

function toResponse<
  T extends {
    id: string;
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
  },
>(artifact: T) {
  return {
    ...artifact,
    createdAt: artifact.createdAt.toISOString(),
    updatedAt: artifact.updatedAt.toISOString(),
    path: `/artifacts/${artifact.id}?workspaceId=${artifact.workspaceId}`,
  };
}

const collectionPath = '/workspace/{workspaceId}/artifacts';
const detailPath = `${collectionPath}/{artifactId}`;
const openapi = { protect: true, tags: ['Artifacts'] };

export const artifactRouter = router({
  list: workspaceProcedure
    .meta({
      openapi: {
        ...openapi,
        method: 'GET',
        path: collectionPath,
        summary: 'List workspace artifacts',
      },
    })
    .input(
      z.object({
        search: z.string().trim().max(200).optional(),
        page: z.number().int().min(1).max(1000000).default(1),
        pageSize: z.number().int().min(1).max(100).default(50),
      })
    )
    .output(z.object({ items: z.array(metadataSchema), hasMore: z.boolean() }))
    .query(async ({ input }) => {
      const { workspaceId, search, page, pageSize } = input;
      const artifacts = await prisma.artifact.findMany({
        where: {
          workspaceId,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' as const } },
                  {
                    description: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              }
            : {}),
        },
        select: metadataSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize + 1,
      });
      return {
        items: artifacts.slice(0, pageSize).map(toResponse),
        hasMore: artifacts.length > pageSize,
      };
    }),

  get: workspaceProcedure
    .meta({
      openapi: {
        ...openapi,
        method: 'GET',
        path: detailPath,
        summary: 'Read an artifact and its HTML',
      },
    })
    .input(artifactIdInput)
    .output(metadataSchema.extend({ source: z.string() }))
    .query(async ({ input }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.artifactId, workspaceId: input.workspaceId },
        select: { ...metadataSelect, source: true },
      });
      if (!artifact) throw new TRPCError({ code: 'NOT_FOUND' });
      return toResponse(artifact);
    }),

  create: workspaceWriteProcedure
    .meta({
      openapi: {
        ...openapi,
        method: 'POST',
        path: collectionPath,
        summary: 'Publish an HTML artifact',
      },
    })
    .input(
      contentInput.extend({
        description: contentInput.shape.description.default(''),
      })
    )
    .output(metadataSchema)
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.create({
        data: { ...input, createdById: ctx.user.id, updatedById: ctx.user.id },
        select: metadataSelect,
      });
      await createWorkspaceMutationAuditLog({
        workspaceId: input.workspaceId,
        path: 'artifact.create',
        input,
        actor: ctx.user,
        relatedId: artifact.id,
      });
      return toResponse(artifact);
    }),

  update: workspaceWriteProcedure
    .meta({
      openapi: {
        ...openapi,
        method: 'PUT',
        path: detailPath,
        summary: 'Replace an artifact at the expected revision',
      },
    })
    .input(
      contentInput.extend({
        ...artifactIdInput.shape,
        expectedRevision: z.number().int().min(1),
      })
    )
    .output(metadataSchema)
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, artifactId, expectedRevision, ...content } = input;
      let artifact;
      try {
        // Keep the revision predicate in the write so concurrent editors cannot overwrite each other.
        artifact = await prisma.artifact.update({
          where: { id: artifactId, workspaceId, revision: expectedRevision },
          data: {
            ...content,
            revision: { increment: 1 },
            updatedById: ctx.user.id,
          },
          select: metadataSelect,
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2025'
        )
          throw error;
        const exists = await prisma.artifact.findFirst({
          where: { id: artifactId, workspaceId },
          select: { id: true },
        });
        throw new TRPCError({
          code: exists ? 'CONFLICT' : 'NOT_FOUND',
          message: exists
            ? 'Artifact changed. Read the current revision before updating.'
            : 'Artifact not found',
        });
      }
      await createWorkspaceMutationAuditLog({
        workspaceId,
        path: 'artifact.update',
        input,
        actor: ctx.user,
        relatedId: artifact.id,
      });
      return toResponse(artifact);
    }),

  delete: workspaceAdminProcedure
    .meta({
      openapi: {
        ...openapi,
        method: 'DELETE',
        path: detailPath,
        summary: 'Delete an artifact',
      },
    })
    .input(artifactIdInput)
    .output(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      let artifact;
      try {
        artifact = await prisma.artifact.delete({
          where: { id: input.artifactId, workspaceId: input.workspaceId },
          select: { id: true },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        )
          throw new TRPCError({ code: 'NOT_FOUND' });
        throw error;
      }
      await createWorkspaceMutationAuditLog({
        workspaceId: input.workspaceId,
        path: 'artifact.delete',
        input,
        actor: ctx.user,
        relatedId: artifact.id,
      });
      return artifact;
    }),
});
