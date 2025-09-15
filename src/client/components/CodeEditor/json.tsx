import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useSettingsStore } from '@/store/settings';
import { useEvent } from '@/hooks/useEvent';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  schema?: any;
  height?: string | number;
  readOnly?: boolean;
  onValidate?: (markers: any[]) => void;
}

export const JsonEditor: React.FC<MonacoJsonEditorProps> = ({
  value,
  onChange,
  schema,
  height = 400,
  readOnly = false,
  onValidate,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON schema if provided
    if (schema) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'http://myserver/schema.json',
            fileMatch: ['*'],
            schema,
          },
        ],
      });
    }

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
          setTimeout(updateMarkers, 100); // Small delay to allow monaco to update markers
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

  // Format JSON on mount
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== value) {
          editorRef.current.setValue(formatted);
        }
      } catch {
        // Invalid JSON, don't format
      }
    }
  }, []);

  return (
    <div className="bg-background overflow-hidden rounded-md border">
      <Editor
        height={height}
        defaultLanguage="json"
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
        }}
      />
    </div>
  );
};
JsonEditor.displayName = 'JsonEditor';
