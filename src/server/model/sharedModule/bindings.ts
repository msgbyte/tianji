import { TRPCError } from '@trpc/server';
import ts from 'typescript';
import { prisma } from '../_client.js';

export interface WorkerModuleBindingInput {
  moduleId: string;
  moduleRevisionId: string;
  importAlias: string;
}

export const MAX_WORKER_SHARED_MODULES = 16;

export function collectSharedModuleImportAliases(code: string): string[] {
  const sourceFile = ts.createSourceFile(
    '/function-worker.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const aliases: string[] = [];
  const seen = new Set<string>();

  const addAlias = (moduleSpecifier: ts.Expression | undefined) => {
    if (!moduleSpecifier || !ts.isStringLiteralLike(moduleSpecifier)) {
      return;
    }

    const alias = moduleSpecifier.text;
    if (!alias.startsWith('@shared/') || seen.has(alias)) {
      return;
    }

    seen.add(alias);
    aliases.push(alias);
  };

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement)
    ) {
      addAlias(statement.moduleSpecifier);
    }
  }

  return aliases;
}

export async function resolveWorkerModuleBindingsFromCode(
  workspaceId: string,
  code: string,
  currentBindings: WorkerModuleBindingInput[] = []
): Promise<WorkerModuleBindingInput[]> {
  const importAliases = collectSharedModuleImportAliases(code);
  const currentByAlias = new Map(
    currentBindings.map((binding) => [binding.importAlias, binding])
  );
  const missingAliases = importAliases.filter(
    (alias) => !currentByAlias.has(alias)
  );
  const modules =
    missingAliases.length > 0
      ? await prisma.sharedModule.findMany({
          where: {
            workspaceId,
            importAlias: { in: missingAliases },
            archivedAt: null,
            latestRevision: { gt: 0 },
          },
          select: {
            id: true,
            importAlias: true,
            revisions: {
              select: { id: true },
              orderBy: { revision: 'desc' },
              take: 1,
            },
          },
        })
      : [];
  const latestByAlias = new Map(
    modules.flatMap((module) => {
      const revision = module.revisions[0];
      return revision
        ? [
            [
              module.importAlias,
              {
                moduleId: module.id,
                moduleRevisionId: revision.id,
                importAlias: module.importAlias,
              } satisfies WorkerModuleBindingInput,
            ] as const,
          ]
        : [];
    })
  );

  return importAliases.map((alias) => {
    const binding = currentByAlias.get(alias) ?? latestByAlias.get(alias);
    if (!binding) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Shared module ${alias} does not exist or has no published revision`,
      });
    }
    return binding;
  });
}

export async function validateWorkerModuleBindings(
  workspaceId: string,
  bindings: WorkerModuleBindingInput[],
  options: {
    allowArchived?: boolean;
    allowedArchivedBindings?: WorkerModuleBindingInput[];
  } = {}
) {
  if (bindings.length > MAX_WORKER_SHARED_MODULES) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `A worker can bind at most ${MAX_WORKER_SHARED_MODULES} shared modules`,
    });
  }

  const allowedArchivedBindings = new Set(
    options.allowedArchivedBindings?.map(bindingKey) ?? []
  );
  const aliases = new Set<string>();
  const moduleIds = new Set<string>();
  for (const binding of bindings) {
    if (aliases.has(binding.importAlias) || moduleIds.has(binding.moduleId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'A worker can bind each shared module and import alias only once',
      });
    }
    aliases.add(binding.importAlias);
    moduleIds.add(binding.moduleId);
  }

  const revisions = await prisma.sharedModuleRevision.findMany({
    where: { id: { in: bindings.map((binding) => binding.moduleRevisionId) } },
    select: {
      id: true,
      moduleId: true,
      module: {
        select: { workspaceId: true, importAlias: true, archivedAt: true },
      },
    },
  });
  const revisionById = new Map(
    revisions.map((revision) => [revision.id, revision])
  );

  for (const binding of bindings) {
    const revision = revisionById.get(binding.moduleRevisionId);
    if (
      !revision ||
      revision.moduleId !== binding.moduleId ||
      revision.module.workspaceId !== workspaceId ||
      revision.module.importAlias !== binding.importAlias
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid shared module revision for ${binding.importAlias}`,
      });
    }
    if (
      revision.module.archivedAt &&
      !options.allowArchived &&
      !allowedArchivedBindings.has(bindingKey(binding))
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Shared module ${binding.importAlias} is archived`,
      });
    }
  }
}

function bindingKey(binding: WorkerModuleBindingInput) {
  return `${binding.moduleId}:${binding.moduleRevisionId}:${binding.importAlias}`;
}

export async function loadWorkerModuleArtifacts(workerId: string) {
  const bindings = await prisma.functionWorkerModuleBinding.findMany({
    where: { workerId },
    orderBy: { importAlias: 'asc' },
    select: {
      importAlias: true,
      moduleRevision: { select: { compiledCode: true } },
    },
  });

  return bindings.map((binding) => ({
    importAlias: binding.importAlias,
    compiledCode: binding.moduleRevision.compiledCode,
  }));
}

export async function loadModuleArtifactsForBindings(
  bindings: WorkerModuleBindingInput[]
) {
  const revisions = await prisma.sharedModuleRevision.findMany({
    where: { id: { in: bindings.map((binding) => binding.moduleRevisionId) } },
    select: { id: true, compiledCode: true },
  });
  const revisionById = new Map(
    revisions.map((revision) => [revision.id, revision])
  );

  return bindings.map((binding) => {
    const revision = revisionById.get(binding.moduleRevisionId);
    if (!revision) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Shared module revision not found for ${binding.importAlias}`,
      });
    }
    return {
      importAlias: binding.importAlias,
      compiledCode: revision.compiledCode,
    };
  });
}

export function wrapSharedModuleDeclaration(
  importAlias: string,
  declarationCode: string
) {
  const ambientDeclarationCode = declarationCode.replace(
    /^(\s*export\s+)declare\s+/gm,
    '$1'
  );

  return `declare module '${importAlias}' {\n${ambientDeclarationCode}\n}\n`;
}
