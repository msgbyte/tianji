import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useRef, useEffect, forwardRef } from 'react';
import { format } from '@sqltools/formatter';
import { useTheme } from '../../store/settings';
import { useEvent } from '../../hooks/useEvent';
import type { editor } from 'monaco-editor';
import {
  createSQLCompletionProvider,
  createSQLHoverProvider,
  createSQLCodeLensProvider,
  disposeSQLCodeLensForEditor,
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
  onSelectSqlChange?: (lineNumber: number, sql: string) => void;
}

export const SQLEditor: React.FC<SQLEditorProps> = React.memo((props) => {
  const {
    readOnly = false,
    tables = [],
    enableRunButton = false,
    onExecuteLine,
    executingLine = null,
    onSelectSqlChange,
  } = props;
  const colorScheme = useTheme();
  const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const lastSelectedLineRef = useRef<number | null>(null);

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

    // Register SQL code lens (run button) and keyboard shortcut if enabled
    if (enableRunButton && onExecuteLine) {
      createSQLCodeLensProvider(
        monaco,
        editor,
        handleExecuteLine,
        executingLine
      );
    }

    // Listen to cursor position changes
    if (onSelectSqlChange) {
      editor.onDidChangeCursorPosition((e) => {
        const lineNumber = e.position.lineNumber;

        // Only trigger if line changed
        if (lastSelectedLineRef.current === lineNumber) {
          return;
        }
        lastSelectedLineRef.current = lineNumber;

        const model = editor.getModel();
        if (!model) {
          return;
        }

        const content = model.getValue();
        const statements = parseSQLStatements(content);

        // Find the statement that contains the current line
        const statement = statements.find(
          (stmt) => stmt.startLine <= lineNumber && stmt.endLine >= lineNumber
        );

        if (statement) {
          onSelectSqlChange(lineNumber, statement.sql);
        }
      });
    }
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
            indent: '  ', // 2 spaces
            reservedWordCase: 'upper',
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
    if (
      enableRunButton &&
      onExecuteLine &&
      monacoRef.current &&
      editorRef.current
    ) {
      createSQLCodeLensProvider(
        monacoRef.current,
        editorRef.current,
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
        // Clean up CodeLens and related disposables for this editor instance
        disposeSQLCodeLensForEditor(editor);
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
