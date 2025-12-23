import React, { useRef, useImperativeHandle } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '@/store/settings';
import { useEvent } from '@/hooks/useEvent';
import { useEditorHighlight } from './lib';

export interface HtmlEditorRef {
  highlightLines: (startLine: number, endLine: number) => void;
  clearHighlight: () => void;
}

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  readOnly?: boolean;
  onValidate?: (markers: any[]) => void;
}

export const HtmlEditor = React.forwardRef<HtmlEditorRef, HtmlEditorProps>(
  ({ value, onChange, height = 400, readOnly = false, onValidate }, ref) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const colorScheme = useTheme();
    const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';

    // Use editor highlight hook
    const { highlightLines, clearHighlight } = useEditorHighlight(
      editorRef,
      monacoRef
    );

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      highlightLines,
      clearHighlight,
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Configure HTML language options
      monaco.languages.html.htmlDefaults.setOptions({
        format: {
          tabSize: 2,
          insertSpaces: true,
          wrapLineLength: 120,
          unformatted: '',
          contentUnformatted: 'pre,code,textarea',
          indentInnerHtml: false,
          preserveNewLines: true,
          maxPreserveNewLines: undefined,
          indentHandlebars: false,
          endWithNewline: false,
          extraLiners: 'head, body, /html',
          wrapAttributes: 'auto',
        },
        suggest: {
          html5: true,
        },
      });

      // Set up validation callback
      if (onValidate) {
        const model = editor.getModel();
        if (model) {
          const updateMarkers = () => {
            const markers = monaco.editor.getModelMarkers({
              resource: model.uri,
            });
            onValidate(markers);
          };

          // Initial validation
          updateMarkers();

          // Listen for model content changes
          model.onDidChangeContent(() => {
            setTimeout(updateMarkers, 100);
          });
        }
      }

      // Configure editor options
      editor.updateOptions({
        formatOnPaste: true,
        formatOnType: true,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        wrappingIndent: 'indent',
        tabSize: 2,
        insertSpaces: true,
      });
    };

    const handleEditorChange = useEvent((value: string | undefined) => {
      if (value !== undefined) {
        onChange(value);
      }
    });

    return (
      <Editor
        height={height}
        defaultLanguage="html"
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          theme,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: 'on',
          wrappingIndent: 'indent',
          padding: { top: 16, bottom: 16 },
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 4,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    );
  }
);

HtmlEditor.displayName = 'HtmlEditor';
