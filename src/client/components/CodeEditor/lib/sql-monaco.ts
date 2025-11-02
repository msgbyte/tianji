import type { Monaco } from '@monaco-editor/react';
import type { SQLTableSchema } from '../sql';
import type { IDisposable } from 'monaco-editor';

/**
 * Track registered providers to avoid duplicate registrations
 */
let sqlCompletionDisposable: IDisposable | null = null;
let sqlHoverDisposable: IDisposable | null = null;
let sqlCodeLensDisposable: IDisposable | null = null;
let sqlCommandDisposable: IDisposable | null = null;
let sqlLanguageConfigured = false;

/**
 * SQL Keywords for autocompletion
 */
export const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE',
  'DROP',
  'ALTER',
  'TABLE',
  'INDEX',
  'VIEW',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'OUTER JOIN',
  'ON',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'LIKE',
  'BETWEEN',
  'ORDER BY',
  'GROUP BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'DISTINCT',
  'NULL',
  'IS NULL',
  'IS NOT NULL',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
] as const;

/**
 * SQL Functions for autocompletion
 */
export const SQL_FUNCTIONS = [
  'COUNT()',
  'SUM()',
  'AVG()',
  'MIN()',
  'MAX()',
  'UPPER()',
  'LOWER()',
  'LENGTH()',
  'TRIM()',
  'CONCAT()',
  'SUBSTRING()',
  'COALESCE()',
  'CAST()',
  'CONVERT()',
  'NOW()',
  'CURRENT_TIMESTAMP',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'DATE()',
  'YEAR()',
  'MONTH()',
  'DAY()',
  'HOUR()',
  'MINUTE()',
] as const;

/**
 * Create SQL Completion Provider
 * Provides intelligent autocompletion for SQL queries
 * Uses singleton pattern to prevent duplicate registrations
 */
export function createSQLCompletionProvider(
  monaco: Monaco,
  tables: SQLTableSchema[]
) {
  // Dispose previous provider if it exists
  if (sqlCompletionDisposable) {
    sqlCompletionDisposable.dispose();
  }

  // Register new provider
  sqlCompletionDisposable = monaco.languages.registerCompletionItemProvider(
    'sql',
    {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // Check if we're after a dot (for column suggestions)
        const lastDotIndex = textUntilPosition.lastIndexOf('.');
        if (
          lastDotIndex !== -1 &&
          lastDotIndex === textUntilPosition.length - 1
        ) {
          // Get the table name before the dot
          const beforeDot = textUntilPosition.substring(0, lastDotIndex).trim();
          const tableNameMatch = beforeDot.match(/(\w+)$/);

          if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const table = tables.find(
              (t) => t.name.toLowerCase() === tableName.toLowerCase()
            );

            if (table) {
              // Suggest columns for this table
              table.columns.forEach((column) => {
                suggestions.push({
                  label: column.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  detail: column.type,
                  documentation:
                    column.description ||
                    `Column: ${column.name} (${column.type})`,
                  insertText: column.name,
                  range: range,
                });
              });
            }
          }
        } else {
          // SQL Keywords
          SQL_KEYWORDS.forEach((keyword) => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              detail: 'SQL Keyword',
              insertText: keyword,
              range: range,
            });
          });

          // SQL Functions
          SQL_FUNCTIONS.forEach((func) => {
            suggestions.push({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: 'SQL Function',
              insertText: func,
              range: range,
            });
          });

          // Table names
          tables.forEach((table) => {
            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: 'Table',
              documentation: `Table with ${table.columns.length} columns`,
              insertText: table.name,
              range: range,
            });
          });

          // All columns from all tables (when not after a dot)
          tables.forEach((table) => {
            table.columns.forEach((column) => {
              suggestions.push({
                label: `${table.name}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: `${column.type} (from ${table.name})`,
                documentation:
                  column.description ||
                  `Column: ${column.name} (${column.type})`,
                insertText: `${table.name}.${column.name}`,
                range: range,
              });
            });
          });
        }

        return { suggestions };
      },
    }
  );

  return sqlCompletionDisposable;
}

/**
 * Create SQL Hover Provider
 * Provides hover information for tables and columns
 * Uses singleton pattern to prevent duplicate registrations
 */
export function createSQLHoverProvider(
  monaco: Monaco,
  tables: SQLTableSchema[]
) {
  // Dispose previous provider if it exists
  if (sqlHoverDisposable) {
    sqlHoverDisposable.dispose();
  }

  // Register new provider
  sqlHoverDisposable = monaco.languages.registerHoverProvider('sql', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) {
        return null;
      }

      const wordText = word.word.toLowerCase();

      // Check if it's a table name
      const table = tables.find((t) => t.name.toLowerCase() === wordText);
      if (table) {
        const columnsInfo = table.columns
          .map(
            (col) =>
              `- **${col.name}** (${col.type})${col.description ? `: ${col.description}` : ''}`
          )
          .join('\n');

        return {
          contents: [
            { value: `**Table: ${table.name}**` },
            { value: `\nColumns:\n${columnsInfo}` },
          ],
        };
      }

      // Check if it's a column name
      for (const table of tables) {
        const column = table.columns.find(
          (col) => col.name.toLowerCase() === wordText
        );
        if (column) {
          return {
            contents: [
              { value: `**Column: ${column.name}**` },
              { value: `Type: ${column.type}` },
              { value: `Table: ${table.name}` },
              ...(column.description
                ? [{ value: `Description: ${column.description}` }]
                : []),
            ],
          };
        }
      }

      return null;
    },
  });

  return sqlHoverDisposable;
}

/**
 * Parse SQL statements from text
 * Split by semicolon and return statement info
 */
export function parseSQLStatements(text: string): Array<{
  sql: string;
  startLine: number;
  endLine: number;
}> {
  const lines = text.split('\n');
  const statements: Array<{
    sql: string;
    startLine: number;
    endLine: number;
  }> = [];

  let currentStatement = '';
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines at the start
    if (!currentStatement && !trimmedLine) {
      startLine = lineNumber + 1;
      continue;
    }

    // Skip comment-only lines
    if (trimmedLine.startsWith('--')) {
      if (!currentStatement) {
        startLine = lineNumber + 1;
      }
      continue;
    }

    currentStatement += line + '\n';

    // Check if line ends with semicolon
    if (trimmedLine.endsWith(';')) {
      const sql = currentStatement.trim();
      if (sql) {
        statements.push({
          sql,
          startLine,
          endLine: lineNumber,
        });
      }
      currentStatement = '';
      startLine = lineNumber + 1;
    }
  }

  // Handle statement without trailing semicolon
  if (currentStatement.trim()) {
    statements.push({
      sql: currentStatement.trim(),
      startLine,
      endLine: lines.length,
    });
  }

  return statements;
}

/**
 * Create SQL Code Lens Provider
 * Adds run buttons to each SQL statement (separated by semicolons)
 */
export function createSQLCodeLensProvider(
  monaco: Monaco,
  onExecuteLine: (lineNumber: number, sql: string) => void | Promise<void>,
  executingLine?: number | null
) {
  // Dispose previous provider if it exists
  if (sqlCodeLensDisposable) {
    sqlCodeLensDisposable.dispose();
    sqlCodeLensDisposable = null;
  }

  // Dispose previous command if it exists
  if (sqlCommandDisposable) {
    sqlCommandDisposable.dispose();
    sqlCommandDisposable = null;
  }

  // Register a single command handler for executing SQL
  const commandId = 'tianji.sql.runStatement';
  sqlCommandDisposable = monaco.editor.registerCommand(
    commandId,
    async (accessor, lineNumber: number, sql: string) => {
      try {
        await onExecuteLine(lineNumber, sql);
      } catch (error) {
        console.error('Error executing SQL:', error);
      }
      // Don't return anything to avoid async response expectation
    }
  );

  // Register new provider
  sqlCodeLensDisposable = monaco.languages.registerCodeLensProvider('sql', {
    provideCodeLenses: (model) => {
      const lenses: any[] = [];
      const text = model.getValue();
      const statements = parseSQLStatements(text);

      // Add code lens for each SQL statement
      statements.forEach((statement, index) => {
        const isExecuting = executingLine === statement.startLine;

        lenses.push({
          range: {
            startLineNumber: statement.startLine,
            startColumn: 1,
            endLineNumber: statement.startLine,
            endColumn: 1,
          },
          id: `run-statement-${index}`,
          command: {
            id: commandId,
            title: isExecuting ? '⏳ Running...' : '▶ Run',
            tooltip: isExecuting
              ? 'Executing SQL statement...'
              : `Execute SQL statement (lines ${statement.startLine}-${statement.endLine})`,
            arguments: [statement.startLine, statement.sql],
          },
        });
      });

      return {
        lenses,
        dispose: () => {},
      };
    },
    resolveCodeLens: (model, codeLens) => {
      return codeLens;
    },
  });

  return sqlCodeLensDisposable;
}

/**
 * Configure SQL language for Monaco Editor
 * Only configures once to avoid duplicate configurations
 */
export function configureSQLLanguage(monaco: Monaco) {
  // Only configure once
  if (sqlLanguageConfigured) {
    return;
  }

  monaco.languages.setLanguageConfiguration('sql', {
    comments: {
      lineComment: '--',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
    ],
  });

  sqlLanguageConfigured = true;
}

/**
 * Dispose all SQL providers
 * Call this to clean up resources when SQL editor is no longer needed
 */
export function disposeSQLProviders() {
  if (sqlCompletionDisposable) {
    sqlCompletionDisposable.dispose();
    sqlCompletionDisposable = null;
  }

  if (sqlHoverDisposable) {
    sqlHoverDisposable.dispose();
    sqlHoverDisposable = null;
  }

  if (sqlCodeLensDisposable) {
    sqlCodeLensDisposable.dispose();
    sqlCodeLensDisposable = null;
  }

  if (sqlCommandDisposable) {
    sqlCommandDisposable.dispose();
    sqlCommandDisposable = null;
  }

  // Reset language configuration flag
  sqlLanguageConfigured = false;
}
