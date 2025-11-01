import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../store/settings';
import { useEvent } from '../../hooks/useEvent';
import {
  createSQLCompletionProvider,
  createSQLHoverProvider,
  createSQLCodeLensProvider,
  configureSQLLanguage,
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

    // Store disposables for cleanup
    (editor as any).__sqlCompletionDisposable = completionDisposable;
    (editor as any).__sqlHoverDisposable = hoverDisposable;
  });

  const handleEditorWillMount = useEvent((monaco: Monaco) => {
    // Configure SQL language settings
    configureSQLLanguage(monaco);
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
