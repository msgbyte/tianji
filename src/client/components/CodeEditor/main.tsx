import Editor, { Monaco } from '@monaco-editor/react';
import React from 'react';
import { useSettingsStore } from '../../store/settings';
import { useEvent } from '../../hooks/useEvent';
import { sandboxGlobal } from './lib/sandbox';

interface CodeEditorProps {
  height?: string | number;
  value?: string;
  onChange?: (code: string) => void;
}
export const CodeEditor: React.FC<CodeEditorProps> = React.memo((props) => {
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const theme = colorScheme === 'dark' ? 'vs-dark' : 'light';

  const handleEditorWillMount = useEvent((monaco: Monaco) => {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      sandboxGlobal,
      'global.ts'
    );
  });

  return (
    <Editor
      height={props.height}
      theme={theme}
      defaultLanguage="javascript"
      value={props.value}
      onChange={(val) => props.onChange?.(val ?? '')}
      beforeMount={handleEditorWillMount}
    />
  );
});
