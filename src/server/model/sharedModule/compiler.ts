import ts from 'typescript';
import { transformTypescriptCode } from '../../utils/vm/utils.js';

export const SHARED_MODULE_ALIAS_PATTERN = /^@shared\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface SharedModuleExportMetadata {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum';
}

export interface CompiledSharedModule {
  compiledCode: string;
  declarationCode: string;
  exportsMetadata: SharedModuleExportMetadata[];
  compilerVersion: string;
}

export class SharedModuleCompileError extends Error {
  constructor(public readonly diagnostics: string[]) {
    super(diagnostics.join('\n'));
    this.name = 'SharedModuleCompileError';
  }
}

export async function compileSharedModule(
  source: string
): Promise<CompiledSharedModule> {
  const sourceFile = ts.createSourceFile(
    '/shared-module.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const dependencyDiagnostics = findDependencyDiagnostics(sourceFile);
  if (dependencyDiagnostics.length > 0) {
    throw new SharedModuleCompileError(dependencyDiagnostics);
  }

  const declarationCode = emitDeclaration(source);
  const compiledCode = await transformTypescriptCode(source);

  return {
    compiledCode,
    declarationCode,
    exportsMetadata: collectExportMetadata(sourceFile),
    compilerVersion: `typescript-${ts.version}/esbuild-0.28.1`,
  };
}

function emitDeclaration(source: string): string {
  const fileName = '/shared-module.ts';
  const options: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    types: [],
  };
  const defaultHost = ts.createCompilerHost(options);
  let declarationCode = '';
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (path) => path === fileName || defaultHost.fileExists(path),
    readFile: (path) => (path === fileName ? source : defaultHost.readFile(path)),
    getSourceFile: (path, languageVersion, onError, shouldCreateNewSourceFile) =>
      path === fileName
        ? ts.createSourceFile(path, source, languageVersion, true, ts.ScriptKind.TS)
        : defaultHost.getSourceFile(
            path,
            languageVersion,
            onError,
            shouldCreateNewSourceFile
          ),
    writeFile: (path, content) => {
      if (path.endsWith('.d.ts')) {
        declarationCode = content;
      }
    },
  };
  const program = ts.createProgram([fileName], options, host);
  const emitResult = program.emit();
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitResult.diagnostics];

  if (diagnostics.length > 0) {
    throw new SharedModuleCompileError(
      diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, source))
    );
  }
  if (!declarationCode.trim()) {
    throw new SharedModuleCompileError([
      'Shared module declaration generation produced no output.',
    ]);
  }

  return declarationCode.trim();
}

function formatDiagnostic(diagnostic: ts.Diagnostic, source: string): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (diagnostic.start === undefined) {
    return message;
  }

  const sourceFile = diagnostic.file ??
    ts.createSourceFile('/shared-module.ts', source, ts.ScriptTarget.Latest, true);
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    diagnostic.start
  );
  return `${line + 1}:${character + 1} ${message}`;
}

function findDependencyDiagnostics(sourceFile: ts.SourceFile): string[] {
  const diagnostics: string[] = [];
  const visit = (node: ts.Node) => {
    const hasStaticDependency =
      ts.isImportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node) ||
      (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined);
    const hasDynamicDependency =
      ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;

    if (hasStaticDependency || hasDynamicDependency) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );
      diagnostics.push(
        `${line + 1}:${character + 1} Shared modules cannot import other modules in the first release.`
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return diagnostics;
}

function collectExportMetadata(
  sourceFile: ts.SourceFile
): SharedModuleExportMetadata[] {
  const result: SharedModuleExportMetadata[] = [];
  const isExported = (node: ts.Node) =>
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node)?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    ) ?? false);

  for (const statement of sourceFile.statements) {
    if (!isExported(statement)) {
      continue;
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      result.push({ name: statement.name.text, kind: 'function' });
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      result.push({ name: statement.name.text, kind: 'class' });
    } else if (ts.isInterfaceDeclaration(statement)) {
      result.push({ name: statement.name.text, kind: 'interface' });
    } else if (ts.isTypeAliasDeclaration(statement)) {
      result.push({ name: statement.name.text, kind: 'type' });
    } else if (ts.isEnumDeclaration(statement)) {
      result.push({ name: statement.name.text, kind: 'enum' });
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          result.push({ name: declaration.name.text, kind: 'variable' });
        }
      }
    }
  }

  return result;
}
