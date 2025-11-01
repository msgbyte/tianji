import type { Monaco } from '@monaco-editor/react';
import type { SQLTableSchema } from '../sql';

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
 */
export function createSQLCompletionProvider(
  monaco: Monaco,
  tables: SQLTableSchema[]
) {
  return monaco.languages.registerCompletionItemProvider('sql', {
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
                column.description || `Column: ${column.name} (${column.type})`,
              insertText: `${table.name}.${column.name}`,
              range: range,
            });
          });
        });
      }

      return { suggestions };
    },
  });
}

/**
 * Create SQL Hover Provider
 * Provides hover information for tables and columns
 */
export function createSQLHoverProvider(
  monaco: Monaco,
  tables: SQLTableSchema[]
) {
  return monaco.languages.registerHoverProvider('sql', {
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
}

/**
 * Configure SQL language for Monaco Editor
 */
export function configureSQLLanguage(monaco: Monaco) {
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
}
