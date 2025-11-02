import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useRef, useEffect, forwardRef } from 'react';
import { format } from 'sql-formatter';
import { useTheme } from '../../store/settings';
import { useEvent } from '../../hooks/useEvent';
import {
  createSQLCompletionProvider,
  createSQLHoverProvider,
  createSQLCodeLensProvider,
  configureSQLLanguage,
  parseSQLStatements,
} from './lib/sql-monaco';

export interface SQLTableSchema {
  name: string;
  columns: {
    name: string;
    type: string;
    description?: string;
  }[];
}

interface SQLEditorProps {
  height?: string | number;
  value?: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  tables?: SQLTableSchema[];
  placeholder?: string;
  onExecuteLine?: (lineNumber: number, sql: string) => void | Promise<void>;
  enableRunButton?: boolean;
  executingLine?: number | null;
}

export const SQLEditor: React.FC<SQLEditorProps> = React.memo((props) => {
  const {
    readOnly = false,
    tables = [],
    enableRunButton = false,
    onExecuteLine,
    executingLine = null,
  } = props;
  const colorScheme = useTheme();
  const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const registerSQLCompletions = useEvent((monaco: Monaco) => {
    return createSQLCompletionProvider(monaco, tables);
  });

  const handleExecuteLine = useEvent(
    async (lineNumber: number, sql: string) => {
      if (onExecuteLine) {
        await onExecuteLine(lineNumber, sql);
      }
    }
  );

  const handleEditorDidMount: OnMount = useEvent((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register SQL completions
    const completionDisposable = registerSQLCompletions(monaco);

    // Register SQL hover provider
    const hoverDisposable = createSQLHoverProvider(monaco, tables);

    // Register SQL code lens (run button) if enabled
    if (enableRunButton && onExecuteLine) {
      const codeLensDisposable = createSQLCodeLensProvider(
        monaco,
        handleExecuteLine,
        executingLine
      );
      (editor as any).__sqlCodeLensDisposable = codeLensDisposable;
    }

    // Register keyboard shortcut to execute current statement/selection (Cmd/Ctrl + Enter)
    if (onExecuteLine) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (!model) return;

        let sql: string;
        let lineNumber: number;

        if (selection && !selection.isEmpty()) {
          // If there is a selection, execute the selected text
          sql = model.getValueInRange(selection);
          lineNumber = selection.startLineNumber;
        } else {
          // If no selection, find and execute the current SQL statement
          const position = editor.getPosition();
          if (!position) return;

          const text = model.getValue();
          const statements = parseSQLStatements(text);

          // Find the statement that contains the current cursor position
          const currentStatement = statements.find(
            (stmt) =>
              position.lineNumber >= stmt.startLine &&
              position.lineNumber <= stmt.endLine
          );

          if (currentStatement) {
            sql = currentStatement.sql;
            lineNumber = currentStatement.startLine;
          } else {
            // Fallback to current line if no statement found
            lineNumber = position.lineNumber;
            sql = model.getLineContent(lineNumber);
          }
        }

        // Trim whitespace and check if line is not empty
        sql = sql.trim();
        if (sql) {
          handleExecuteLine(lineNumber, sql);
        }
      });
    }

    // Store disposables for cleanup
    (editor as any).__sqlCompletionDisposable = completionDisposable;
    (editor as any).__sqlHoverDisposable = hoverDisposable;
  });

  const handleEditorWillMount = useEvent((monaco: Monaco) => {
    // Configure SQL language settings
    configureSQLLanguage(monaco);

    // Register document formatting provider for SQL
    monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits: (model) => {
        const currentValue = model.getValue();
        if (!currentValue) {
          return [];
        }

        try {
          const formatted = format(currentValue, {
            language: 'sql',
            tabWidth: 2,
            keywordCase: 'upper',
          });

          // Return edit that replaces entire document
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        } catch (error) {
          console.error('Failed to format SQL:', error);
          return [];
        }
      },
    });
  });

  // Update code lens when executingLine changes
  useEffect(() => {
    if (enableRunButton && onExecuteLine && monacoRef.current) {
      createSQLCodeLensProvider(
        monacoRef.current,
        handleExecuteLine,
        executingLine
      );
    }
  }, [executingLine, enableRunButton, onExecuteLine, handleExecuteLine]);

  // Cleanup disposables on unmount
  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      if (editor) {
        editor.__sqlCompletionDisposable?.dispose();
        editor.__sqlHoverDisposable?.dispose();
        editor.__sqlCodeLensDisposable?.dispose();
      }
    };
  }, []);

  return (
    <Editor
      height={props.height}
      theme={theme}
      defaultLanguage="sql"
      value={props.value}
      options={{
        tabSize: 2,
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        wrappingIndent: 'indent',
        formatOnPaste: true,
        formatOnType: true,
        minimap: { enabled: false },
        codeLens: enableRunButton,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
      }}
      onChange={(val) => props.onChange?.(val ?? '')}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
    />
  );
});
SQLEditor.displayName = 'SQLEditor';
