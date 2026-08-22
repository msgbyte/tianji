import { describe, expect, test } from 'vitest';
import type { Monaco } from '@monaco-editor/react';
import ts from 'typescript';
import {
  buildSharedModuleTypeDetails,
  registerSharedModuleTypeHover,
  retainExtraLibraryModel,
} from './shared-module-types';

describe('buildSharedModuleTypeDetails', () => {
  test('expands referenced declarations up to two levels', () => {
    const source = `declare module '@shared/alert' {
export interface AlertMeta {
  severity: 'low' | 'high';
}
export interface Alert {
  title: string;
  meta: AlertMeta;
}
export function sendAlert(alert: Alert): Promise<{ sent: boolean }>;
}`;
    const alertMetaStart = source.indexOf('export interface AlertMeta');
    const alertMetaEnd = source.indexOf('\n}', alertMetaStart) + 2;
    const alertStart = source.indexOf('export interface Alert {');
    const alertEnd = source.indexOf('\n}', alertStart) + 2;
    const navigationTree = {
      text: '<global>',
      kind: 'script',
      childItems: [
        {
          text: '"@shared/alert"',
          kind: 'module',
          childItems: [
            {
              text: 'AlertMeta',
              kind: 'interface',
              spans: [
                { start: alertMetaStart, length: alertMetaEnd - alertMetaStart },
              ],
            },
            {
              text: 'Alert',
              kind: 'interface',
              spans: [{ start: alertStart, length: alertEnd - alertStart }],
            },
          ],
        },
      ],
    };

    expect(
      buildSharedModuleTypeDetails(
        source,
        navigationTree,
        '(alias) function sendAlert(alert: Alert): Promise<{ sent: boolean }>'
      )
    ).toBe(`export interface Alert {
  title: string;
  meta: AlertMeta;
}

export interface AlertMeta {
  severity: 'low' | 'high';
}`);
  });

  test('falls back to declaration text when navigation spans are narrow', () => {
    const source = `declare module '@shared/alert' {
export type Alert = {
  title: string;
  nested: { enabled: boolean };
};
}`;

    expect(
      buildSharedModuleTypeDetails(
        source,
        {
          text: '<global>',
          kind: 'script',
          childItems: [
            {
              text: 'Alert',
              kind: 'type',
              spans: [{ start: source.indexOf('Alert'), length: 5 }],
            },
          ],
        },
        'type Alert = { title: string }'
      )
    ).toBe(`export type Alert = {
  title: string;
  nested: { enabled: boolean };
};`);
  });

  test('does not add a hover when a signature only uses inline types', () => {
    expect(
      buildSharedModuleTypeDetails(
        'export function ping(input: { value: string }): void;',
        { text: '<global>', kind: 'script' },
        'function ping(input: { value: string }): void'
      )
    ).toBeNull();
  });

  test('supports the navigation tree emitted by the TypeScript service', () => {
    const fileName = '/shared-module.d.ts';
    const source = `declare module '@shared/alert' {
export interface AlertMeta {
  severity: 'low' | 'high';
}
export interface Alert {
  title: string;
  meta: AlertMeta;
}
export function sendAlert(alert: Alert): Promise<void>;
}`;
    const service = ts.createLanguageService({
      getCompilationSettings: () => ({ declaration: true }),
      getCurrentDirectory: () => '/',
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      readFile: ts.sys.readFile,
      fileExists: ts.sys.fileExists,
      getScriptFileNames: () => [fileName],
      getScriptSnapshot: (path) =>
        path === fileName ? ts.ScriptSnapshot.fromString(source) : undefined,
      getScriptVersion: () => '1',
    });
    const navigationTree = service.getNavigationTree(fileName);

    expect(
      buildSharedModuleTypeDetails(
        source,
        navigationTree,
        'function sendAlert(alert: Alert): Promise<void>'
      )
    ).toContain('export interface AlertMeta');
  });

  test('keeps a shared declaration model until every editor releases it', () => {
    let value = 'initial';
    let disposed = false;
    const model = {
      getValue: () => value,
      setValue: (nextValue: string) => {
        value = nextValue;
      },
      isDisposed: () => disposed,
      dispose: () => {
        disposed = true;
      },
    };
    let createCount = 0;
    const monaco = {
      Uri: {
        parse: (path: string) => ({ toString: () => path }),
      },
      editor: {
        getModel: () => null,
        createModel: () => {
          createCount += 1;
          return model;
        },
      },
    } as unknown as Monaco;
    const library = {
      content: 'declare module "@shared/alert" {}',
      filePath: 'file:///tianji/shared-modules/model-lifecycle/revision.d.ts',
    };

    const first = retainExtraLibraryModel(monaco, library);
    const second = retainExtraLibraryModel(monaco, library);

    expect(createCount).toBe(1);
    expect(value).toBe(library.content);
    first.dispose();
    expect(disposed).toBe(false);
    second.dispose();
    expect(disposed).toBe(true);
  });

  test('opens shared-module go-to-definition requests in Peek', async () => {
    let opener:
      | {
          openCodeEditor: (
            sourceEditor: { trigger: (...args: unknown[]) => void },
            resource: { toString: () => string }
          ) => boolean | Promise<boolean>;
        }
      | undefined;
    const disposable = { dispose: () => undefined };
    const monaco = {
      languages: {
        registerHoverProvider: () => disposable,
      },
      editor: {
        registerEditorOpener: (nextOpener: typeof opener) => {
          opener = nextOpener;
          return disposable;
        },
      },
    } as unknown as Monaco;
    const triggers: unknown[][] = [];
    const sourceEditor = {
      trigger: (...args: unknown[]) => triggers.push(args),
    };

    registerSharedModuleTypeHover(monaco);
    expect(
      opener?.openCodeEditor(sourceEditor, {
        toString: () =>
          'file:///tianji/shared-modules/module-id/revision-id.d.ts',
      })
    ).toBe(true);
    await Promise.resolve();

    expect(triggers).toEqual([
      [
        'tianji.sharedModules',
        'editor.action.peekDefinition',
        undefined,
      ],
    ]);
    expect(
      opener?.openCodeEditor(sourceEditor, {
        toString: () => 'file:///worker.ts',
      })
    ).toBe(false);
  });
});
