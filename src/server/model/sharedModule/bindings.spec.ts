import { beforeEach, describe, expect, test, vi } from 'vitest';
import ts from 'typescript';

const mocks = vi.hoisted(() => ({
  findModules: vi.fn(),
  findRevisions: vi.fn(),
}));

vi.mock('../_client.js', () => ({
  prisma: {
    sharedModule: {
      findMany: mocks.findModules,
    },
    sharedModuleRevision: {
      findMany: mocks.findRevisions,
    },
  },
}));

import {
  collectSharedModuleImportAliases,
  resolveWorkerModuleBindingsFromCode,
  validateWorkerModuleBindings,
  wrapSharedModuleDeclaration,
  type WorkerModuleBindingInput,
} from './bindings.js';

const binding: WorkerModuleBindingInput = {
  moduleId: 'module-1',
  moduleRevisionId: 'revision-1',
  importAlias: '@shared/math',
};

describe('wrapSharedModuleDeclaration', () => {
  test('removes redundant declare modifiers from an ambient module', () => {
    const declaration = wrapSharedModuleDeclaration(
      '@shared/alert',
      `export interface Alert {
  title: string;
}
export declare const defaultAlert: Alert;
export declare function sendAlert(alert: Alert): boolean;
export declare class AlertClient {
  send(alert: Alert): boolean;
}`
    );

    expect(declaration).toBe(`declare module '@shared/alert' {
export interface Alert {
  title: string;
}
export const defaultAlert: Alert;
export function sendAlert(alert: Alert): boolean;
export class AlertClient {
  send(alert: Alert): boolean;
}
}
`);

    const fileName = '/shared-module.d.ts';
    const options: import('typescript').CompilerOptions = {
      noEmit: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      types: [],
    };
    const defaultHost = ts.createCompilerHost(options);
    const host: import('typescript').CompilerHost = {
      ...defaultHost,
      fileExists: (path) => path === fileName || defaultHost.fileExists(path),
      readFile: (path) =>
        path === fileName ? declaration : defaultHost.readFile(path),
      getSourceFile: (
        path,
        languageVersion,
        onError,
        shouldCreateNewSourceFile
      ) =>
        path === fileName
          ? ts.createSourceFile(
              path,
              declaration,
              languageVersion,
              true,
              ts.ScriptKind.TS
            )
          : defaultHost.getSourceFile(
              path,
              languageVersion,
              onError,
              shouldCreateNewSourceFile
            ),
    };
    const diagnostics = ts.getPreEmitDiagnostics(
      ts.createProgram([fileName], options, host)
    );

    expect(
      diagnostics.map((diagnostic) => [
        diagnostic.code,
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      ])
    ).toEqual([]);
  });
});

describe('validateWorkerModuleBindings', () => {
  beforeEach(() => {
    mocks.findModules.mockReset();
    mocks.findRevisions.mockReset();
    mocks.findRevisions.mockResolvedValue([
      {
        id: binding.moduleRevisionId,
        moduleId: binding.moduleId,
        module: {
          workspaceId: 'workspace-1',
          importAlias: binding.importAlias,
          archivedAt: null,
        },
      },
    ]);
  });

  test('accepts an immutable revision from the same workspace and alias', async () => {
    await expect(
      validateWorkerModuleBindings('workspace-1', [binding])
    ).resolves.toBeUndefined();
  });

  test('rejects cross-workspace and alias mismatches', async () => {
    mocks.findRevisions.mockResolvedValueOnce([
      {
        id: binding.moduleRevisionId,
        moduleId: binding.moduleId,
        module: {
          workspaceId: 'workspace-2',
          importAlias: binding.importAlias,
          archivedAt: null,
        },
      },
    ]);

    await expect(
      validateWorkerModuleBindings('workspace-1', [binding])
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: `Invalid shared module revision for ${binding.importAlias}`,
    });
  });

  test('keeps an existing archived binding but blocks a new archived binding', async () => {
    mocks.findRevisions.mockResolvedValue([
      {
        id: binding.moduleRevisionId,
        moduleId: binding.moduleId,
        module: {
          workspaceId: 'workspace-1',
          importAlias: binding.importAlias,
          archivedAt: new Date(),
        },
      },
    ]);

    await expect(
      validateWorkerModuleBindings('workspace-1', [binding])
    ).rejects.toThrow(`Shared module ${binding.importAlias} is archived`);

    await expect(
      validateWorkerModuleBindings('workspace-1', [binding], {
        allowedArchivedBindings: [binding],
      })
    ).resolves.toBeUndefined();
  });

  test('rejects duplicate aliases and graphs above the module count limit', async () => {
    await expect(
      validateWorkerModuleBindings('workspace-1', [
        binding,
        { ...binding, moduleId: 'module-2', moduleRevisionId: 'revision-2' },
      ])
    ).rejects.toThrow(
      'A worker can bind each shared module and import alias only once'
    );

    await expect(
      validateWorkerModuleBindings(
        'workspace-1',
        Array.from({ length: 17 }, (_, index) => ({
          moduleId: `module-${index}`,
          moduleRevisionId: `revision-${index}`,
          importAlias: `@shared/module-${index}`,
        }))
      )
    ).rejects.toThrow('A worker can bind at most 16 shared modules');
  });
});

describe('resolveWorkerModuleBindingsFromCode', () => {
  beforeEach(() => {
    mocks.findModules.mockReset();
    mocks.findRevisions.mockReset();
  });

  test('collects unique static shared-module imports and re-exports', () => {
    const code = `
      import type { Alert } from '@shared/alert';
      import { sendAlert } from '@shared/alert';
      export { formatDate } from '@shared/dates';
      const example = "import { fake } from '@shared/fake'";
      async function load() { return import('@shared/dynamic'); }
    `;

    expect(collectSharedModuleImportAliases(code)).toEqual([
      '@shared/alert',
      '@shared/dates',
    ]);
  });

  test('preserves pinned imports, adds latest revisions, and removes unused bindings', async () => {
    const currentAlert: WorkerModuleBindingInput = {
      moduleId: 'module-alert',
      moduleRevisionId: 'revision-alert-1',
      importAlias: '@shared/alert',
    };
    mocks.findModules.mockResolvedValue([
      {
        id: 'module-dates',
        importAlias: '@shared/dates',
        revisions: [{ id: 'revision-dates-3' }],
      },
    ]);

    await expect(
      resolveWorkerModuleBindingsFromCode(
        'workspace-1',
        `
          import { sendAlert } from '@shared/alert';
          import { formatDate } from '@shared/dates';
        `,
        [
          currentAlert,
          {
            moduleId: 'module-unused',
            moduleRevisionId: 'revision-unused-2',
            importAlias: '@shared/unused',
          },
        ]
      )
    ).resolves.toEqual([
      currentAlert,
      {
        moduleId: 'module-dates',
        moduleRevisionId: 'revision-dates-3',
        importAlias: '@shared/dates',
      },
    ]);
    expect(mocks.findModules).toHaveBeenCalledWith({
      where: {
        workspaceId: 'workspace-1',
        importAlias: { in: ['@shared/dates'] },
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
    });
  });

  test('rejects an unavailable imported shared module', async () => {
    mocks.findModules.mockResolvedValue([]);

    await expect(
      resolveWorkerModuleBindingsFromCode(
        'workspace-1',
        `import { missing } from '@shared/missing';`
      )
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message:
        'Shared module @shared/missing does not exist or has no published revision',
    });
  });
});
