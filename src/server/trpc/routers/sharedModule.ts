import { WorkspaceAuditLogType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { ROLES } from '@tianji/shared';
import { z } from 'zod';
import { createAuditLog } from '../../model/auditLog.js';
import { prisma } from '../../model/_client.js';
import {
  compileSharedModule,
  SHARED_MODULE_ALIAS_PATTERN,
  SharedModuleCompileError,
} from '../../model/sharedModule/compiler.js';
import { wrapSharedModuleDeclaration } from '../../model/sharedModule/bindings.js';
import { getWorkspaceUser } from '../../model/workspace.js';
import { router, workspaceProcedure } from '../trpc.js';

const userSelect = {
  id: true,
  username: true,
  nickname: true,
  avatar: true,
} as const;

const moduleIdInput = z.object({ moduleId: z.cuid2() });

const publishInput = z.object({
  id: z.cuid2().optional(),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  importAlias: z
    .string()
    .regex(
      SHARED_MODULE_ALIAS_PATTERN,
      'Import alias must look like @shared/my-module'
    ),
  source: z.string().min(1),
  ownerId: z.cuid2().nullable().optional(),
});

export const sharedModuleRouter = router({
  all: workspaceProcedure.query(async ({ input }) =>
    prisma.sharedModule.findMany({
      where: { workspaceId: input.workspaceId },
      include: {
        owner: { select: userSelect },
        _count: { select: { workerBindings: true, revisions: true } },
      },
      orderBy: [{ archivedAt: 'asc' }, { updatedAt: 'desc' }],
    })
  ),

  get: workspaceProcedure
    .input(moduleIdInput)
    .query(async ({ input }) =>
      prisma.sharedModule.findUnique({
        where: { id: input.moduleId, workspaceId: input.workspaceId },
        include: { owner: { select: userSelect } },
      })
    ),

  validate: workspaceProcedure
    .input(z.object({ source: z.string().min(1), moduleId: z.cuid2().optional() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceUser = await getWorkspaceUser(input.workspaceId, ctx.user.id);
      const isAdmin = isWorkspaceAdmin(workspaceUser?.role);
      if (input.moduleId) {
        const module = await prisma.sharedModule.findUnique({
          where: { id: input.moduleId, workspaceId: input.workspaceId },
          select: { ownerId: true },
        });
        if (!module) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared module not found' });
        }
        assertCanEditSharedModule(isAdmin, ctx.user.id, module.ownerId);
      } else if (!isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return compileForApi(input.source);
    }),

  publish: workspaceProcedure
    .input(publishInput)
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, id, ownerId, source, ...data } = input;
      const workspaceUser = await getWorkspaceUser(workspaceId, ctx.user.id);
      const isAdmin = isWorkspaceAdmin(workspaceUser?.role);

      if (!id && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      let existing:
        | {
            ownerId: string | null;
            archivedAt: Date | null;
            importAlias: string;
          }
        | null = null;
      if (id) {
        existing = await prisma.sharedModule.findUnique({
          where: { id, workspaceId },
          select: { ownerId: true, archivedAt: true, importAlias: true },
        });
        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Shared module not found',
          });
        }
        assertCanEditSharedModule(isAdmin, ctx.user.id, existing.ownerId);
        if (existing.archivedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Shared module is archived',
          });
        }
        if (existing.importAlias !== data.importAlias) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Import alias is immutable after the first publish',
          });
        }
      }

      if (ownerId !== undefined && ownerId !== existing?.ownerId) {
        if (!isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        if (ownerId && !(await getWorkspaceUser(workspaceId, ownerId))) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Shared module owner must be a workspace member',
          });
        }
      }

      const compiled = await compileForApi(source);
      const result = await prisma.$transaction(async (tx) => {
        let module;
        let nextRevision: number;

        if (id) {
          const current = await tx.sharedModule.findUniqueOrThrow({
            where: { id, workspaceId },
            select: { latestRevision: true, archivedAt: true },
          });
          if (current.archivedAt) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Shared module is archived',
            });
          }
          nextRevision = current.latestRevision + 1;
          module = await tx.sharedModule.update({
            where: { id, workspaceId },
            data: { ...data, ...(ownerId !== undefined ? { ownerId } : {}) },
          });
        } else {
          nextRevision = 1;
          module = await tx.sharedModule.create({
            data: {
              ...data,
              workspaceId,
              ownerId: ownerId ?? ctx.user.id,
            },
          });
        }

        const revision = await tx.sharedModuleRevision.create({
          data: {
            moduleId: module.id,
            operatorId: ctx.user.id,
            revision: nextRevision,
            source,
            compiledCode: compiled.compiledCode,
            declarationCode: compiled.declarationCode,
            exportsMetadata: compiled.exportsMetadata,
            compilerVersion: compiled.compilerVersion,
          },
        });
        const publishedModule = await tx.sharedModule.update({
          where: { id: module.id },
          data: { latestRevision: nextRevision },
        });
        return { module: publishedModule, revision };
      });

      await createAuditLog({
        workspaceId,
        relatedId: result.module.id,
        relatedType: WorkspaceAuditLogType.SharedModule,
        content: `Published shared module: ${result.module.importAlias} revision #${result.revision.revision} by ${ctx.user.username}(${ctx.user.id})`,
      });
      return result;
    }),

  archive: workspaceProcedure
    .input(moduleIdInput)
    .mutation(async ({ input, ctx }) => {
      const module = await prisma.sharedModule.findUnique({
        where: { id: input.moduleId, workspaceId: input.workspaceId },
      });
      if (!module) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared module not found' });
      }
      const workspaceUser = await getWorkspaceUser(input.workspaceId, ctx.user.id);
      assertCanEditSharedModule(
        isWorkspaceAdmin(workspaceUser?.role),
        ctx.user.id,
        module.ownerId
      );
      if (module.archivedAt) {
        return module;
      }

      const archived = await prisma.sharedModule.update({
        where: { id: module.id },
        data: { archivedAt: new Date() },
      });
      await createAuditLog({
        workspaceId: input.workspaceId,
        relatedId: module.id,
        relatedType: WorkspaceAuditLogType.SharedModule,
        content: `Archived shared module: ${module.importAlias} by ${ctx.user.username}(${ctx.user.id})`,
      });
      return archived;
    }),

  revisions: workspaceProcedure
    .input(moduleIdInput)
    .query(async ({ input }) => {
      await assertModuleInWorkspace(input.workspaceId, input.moduleId);
      return prisma.sharedModuleRevision.findMany({
        where: { moduleId: input.moduleId },
        include: { operator: { select: userSelect } },
        orderBy: { revision: 'desc' },
      });
    }),

  consumers: workspaceProcedure
    .input(moduleIdInput)
    .query(async ({ input }) => {
      await assertModuleInWorkspace(input.workspaceId, input.moduleId);
      return prisma.functionWorkerModuleBinding.findMany({
        where: { moduleId: input.moduleId },
        include: {
          worker: { select: { id: true, name: true, active: true, revision: true } },
          moduleRevision: { select: { id: true, revision: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  bindingOptions: workspaceProcedure.query(async ({ input }) => {
    const modules = await prisma.sharedModule.findMany({
      where: {
        workspaceId: input.workspaceId,
        archivedAt: null,
        latestRevision: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        importAlias: true,
        latestRevision: true,
        revisions: {
          select: { id: true, revision: true, declarationCode: true },
          orderBy: { revision: 'desc' },
          take: 1,
        },
      },
      orderBy: { importAlias: 'asc' },
    });

    return modules.map((module) => ({
      ...module,
      revisions: module.revisions.map((revision) => ({
        ...revision,
        typeDeclaration: wrapSharedModuleDeclaration(
          module.importAlias,
          revision.declarationCode
        ),
      })),
    }));
  }),
});

async function compileForApi(source: string) {
  try {
    return await compileSharedModule(source);
  } catch (error) {
    if (error instanceof SharedModuleCompileError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
}

async function assertModuleInWorkspace(workspaceId: string, moduleId: string) {
  const module = await prisma.sharedModule.findUnique({
    where: { id: moduleId, workspaceId },
    select: { id: true },
  });
  if (!module) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared module not found' });
  }
}

function assertCanEditSharedModule(
  isAdmin: boolean,
  userId: string,
  ownerId: string | null
) {
  if (!isAdmin && ownerId !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}

function isWorkspaceAdmin(role?: string) {
  return role === ROLES.owner || role === ROLES.admin;
}
