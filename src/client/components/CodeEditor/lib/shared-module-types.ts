import type { Monaco } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import type { CodeEditorExtraLibrary } from '../main';

const SHARED_MODULE_PATH = '/tianji/shared-modules/';
const TYPE_KINDS = new Set(['class', 'enum', 'interface', 'type']);
const MAX_TYPE_DEPTH = 2;
const MAX_TYPE_COUNT = 8;
const MAX_TYPE_DETAIL_LENGTH = 6_000;

interface TextSpan {
  start: number;
  length: number;
}

interface NavigationTree {
  text: string;
  kind: string;
  spans?: TextSpan[];
  childItems?: NavigationTree[];
}

interface QuickInfoPart {
  text?: string;
}

interface RetainedModel {
  model: editor.ITextModel;
  owned: boolean;
  references: number;
}

const retainedModels = new Map<string, RetainedModel>();
let hoverRegistration:
  | { monaco: Monaco; disposables: IDisposable[] }
  | undefined;

export function retainExtraLibraryModel(
  monaco: Monaco,
  library: CodeEditorExtraLibrary
): IDisposable {
  const uri = monaco.Uri.parse(library.filePath);
  const key = uri.toString();
  let retained = retainedModels.get(key);

  if (!retained) {
    const existingModel = monaco.editor.getModel(uri);
    const model =
      existingModel ??
      monaco.editor.createModel(library.content, 'typescript', uri);
    retained = {
      model,
      owned: !existingModel,
      references: 0,
    };
    retainedModels.set(key, retained);
  }

  retained.references += 1;
  if (retained.model.getValue() !== library.content) {
    retained.model.setValue(library.content);
  }

  let disposed = false;
  return {
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      const current = retainedModels.get(key);
      if (!current) {
        return;
      }
      current.references -= 1;
      if (current.references > 0) {
        return;
      }
      retainedModels.delete(key);
      if (current.owned && !current.model.isDisposed()) {
        current.model.dispose();
      }
    },
  };
}

export function registerSharedModuleTypeHover(monaco: Monaco) {
  if (hoverRegistration?.monaco === monaco) {
    return;
  }
  hoverRegistration?.disposables.forEach((disposable) => disposable.dispose());

  const provider = {
    provideHover: async (
      model: editor.ITextModel,
      position: { lineNumber: number; column: number },
      token: { isCancellationRequested: boolean }
    ) => {
      const word = model.getWordAtPosition(position);
      if (!word || !model.getValue().includes('@shared/')) {
        return null;
      }

      try {
        const getWorker =
          model.getLanguageId() === 'javascript'
            ? await monaco.languages.typescript.getJavaScriptWorker()
            : await monaco.languages.typescript.getTypeScriptWorker();
        if (token.isCancellationRequested) {
          return null;
        }

        const worker = await getWorker(model.uri);
        const fileName = model.uri.toString();
        const offset = model.getOffsetAt(position);
        const [definitions, quickInfo] = await Promise.all([
          worker.getDefinitionAtPosition(fileName, offset),
          worker.getQuickInfoAtPosition(fileName, offset),
        ]);
        if (token.isCancellationRequested) {
          return null;
        }

        const definition = definitions?.find((item) =>
          isSharedModuleFile(item.fileName)
        );
        if (!definition) {
          return null;
        }

        const [source, navigationTree] = await Promise.all([
          worker.getScriptText(definition.fileName),
          worker.getNavigationTree(definition.fileName),
        ]);
        if (!source || !navigationTree || token.isCancellationRequested) {
          return null;
        }

        const quickInfoText = (quickInfo?.displayParts ?? [])
          .map((part: QuickInfoPart) => part.text ?? '')
          .join('');
        const details = buildSharedModuleTypeDetails(
          source,
          navigationTree,
          quickInfoText
        );
        if (!details) {
          return null;
        }

        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: '**Shared module type details**' },
            { value: `\`\`\`typescript\n${details}\n\`\`\`` },
            {
              value:
                'Use **Peek Definition** (`Alt+F12`) to inspect the complete declaration. **Go to Definition** (`F12`) opens shared modules in the same read-only Peek view.',
            },
          ],
        };
      } catch {
        // Monaco can dispose a model while an asynchronous hover is resolving.
        return null;
      }
    },
  };

  hoverRegistration = {
    monaco,
    disposables: [
      ...['typescript', 'javascript'].map((language) =>
        monaco.languages.registerHoverProvider(language, provider)
      ),
      monaco.editor.registerEditorOpener({
        openCodeEditor: (sourceEditor, resource) => {
          if (!isSharedModuleFile(resource.toString())) {
            return false;
          }

          queueMicrotask(() =>
            sourceEditor.trigger(
              'tianji.sharedModules',
              'editor.action.peekDefinition',
              undefined
            )
          );
          return true;
        },
      }),
    ],
  };
}

export function buildSharedModuleTypeDetails(
  source: string,
  navigationTree: NavigationTree,
  quickInfoText: string
): string | null {
  const typeItems = new Map<string, NavigationTree>();
  collectTypeItems(navigationTree, typeItems);

  const queue = collectIdentifiers(quickInfoText).map((name) => ({
    name,
    depth: 0,
  }));
  const seen = new Set<string>();
  const snippets: string[] = [];
  let totalLength = 0;

  while (queue.length > 0 && snippets.length < MAX_TYPE_COUNT) {
    const next = queue.shift();
    if (!next || next.depth >= MAX_TYPE_DEPTH || seen.has(next.name)) {
      continue;
    }
    seen.add(next.name);

    const item = typeItems.get(next.name);
    if (!item) {
      continue;
    }
    const snippet = getTypeSnippet(source, item);
    if (!snippet) {
      continue;
    }

    if (totalLength + snippet.length > MAX_TYPE_DETAIL_LENGTH) {
      snippets.push('// Additional type details were truncated.');
      break;
    }
    snippets.push(snippet);
    totalLength += snippet.length;

    for (const name of collectIdentifiers(snippet)) {
      if (!seen.has(name) && typeItems.has(name)) {
        queue.push({ name, depth: next.depth + 1 });
      }
    }
  }

  return snippets.length > 0 ? snippets.join('\n\n') : null;
}

function isSharedModuleFile(fileName: unknown): fileName is string {
  return typeof fileName === 'string' && fileName.includes(SHARED_MODULE_PATH);
}

function collectTypeItems(
  item: NavigationTree,
  result: Map<string, NavigationTree>
) {
  if (TYPE_KINDS.has(item.kind) && !result.has(item.text)) {
    result.set(item.text, item);
  }
  item.childItems?.forEach((child) => collectTypeItems(child, result));
}

function collectIdentifiers(value: string): string[] {
  return value.match(/[A-Za-z_$][\w$]*/g) ?? [];
}

function getTypeSnippet(source: string, item: NavigationTree): string | null {
  const span = item.spans?.[0];
  if (span) {
    const snippet = source.slice(span.start, span.start + span.length).trim();
    if (isTypeDeclaration(snippet, item.text)) {
      return snippet;
    }
  }

  return findTypeDeclaration(source, item.text);
}

function isTypeDeclaration(value: string, name: string) {
  return new RegExp(
    `\\b(?:class|enum|interface|type)\\s+${escapeRegExp(name)}\\b`
  ).test(value);
}

function findTypeDeclaration(source: string, name: string): string | null {
  const pattern = new RegExp(
    `(?:export\\s+)?(?:declare\\s+)?(?:abstract\\s+)?(class|enum|interface|type)\\s+${escapeRegExp(name)}\\b`
  );
  const match = pattern.exec(source);
  if (!match) {
    return null;
  }

  const start = match.index;
  const kind = match[1];
  if (kind === 'type') {
    const end = findStatementEnd(source, start);
    return source.slice(start, end).trim();
  }

  const bodyStart = source.indexOf('{', pattern.lastIndex);
  if (bodyStart < 0) {
    return null;
  }
  const bodyEnd = findMatchingBrace(source, bodyStart);
  return bodyEnd < 0 ? null : source.slice(start, bodyEnd + 1).trim();
}

function findStatementEnd(source: string, start: number) {
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '{') {
      braces += 1;
    } else if (char === '}') {
      braces -= 1;
    } else if (char === '[') {
      brackets += 1;
    } else if (char === ']') {
      brackets -= 1;
    } else if (char === '(') {
      parentheses += 1;
    } else if (char === ')') {
      parentheses -= 1;
    } else if (
      char === ';' &&
      braces === 0 &&
      brackets === 0 &&
      parentheses === 0
    ) {
      return index + 1;
    }
  }

  return source.length;
}

function findMatchingBrace(source: string, start: number) {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
