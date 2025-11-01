import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useRef } from 'react';
import { useTheme } from '../../store/settings';
import { useEvent } from '../../hooks/useEvent';
import {
  createSQLCompletionProvider,
  createSQLHoverProvider,
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
}

export const SQLEditor: React.FC<SQLEditorProps> = React.memo((props) => {
  const { readOnly = false, tables = [] } = props;
  const colorScheme = useTheme();
  const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const registerSQLCompletions = useEvent((monaco: Monaco) => {
    return createSQLCompletionProvider(monaco, tables);
  });

  const handleEditorDidMount: OnMount = useEvent((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register SQL completions
    const completionDisposable = registerSQLCompletions(monaco);

    // Register SQL hover provider
    const hoverDisposable = createSQLHoverProvider(monaco, tables);

    // Store disposables for cleanup
    (editor as any).__sqlCompletionDisposable = completionDisposable;
    (editor as any).__sqlHoverDisposable = hoverDisposable;
  });

  const handleEditorWillMount = useEvent((monaco: Monaco) => {
    // Configure SQL language settings
    configureSQLLanguage(monaco);
  });

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
