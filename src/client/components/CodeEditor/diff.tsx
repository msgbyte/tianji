import React, { useMemo } from 'react';
import {
  DiffEditor as MonacoDiffEditorComponent,
  DiffEditorProps as MonacoDiffEditorProps,
} from '@monaco-editor/react';
import { useTheme } from '../../store/settings';

export interface CodeDiffEditorProps
  extends Omit<
    MonacoDiffEditorProps,
    'theme' | 'language' | 'height' | 'original' | 'modified'
  > {
  original: string;
  modified: string;
  height?: string | number;
  language?: string;
}

export const CodeDiffEditor: React.FC<CodeDiffEditorProps> = React.memo(
  ({
    original,
    modified,
    height = 420,
    language = 'typescript',
    options,
    ...rest
  }) => {
    const colorTheme = useTheme();
    const theme = colorTheme === 'dark' ? 'vs-dark' : 'light';

    const computedOptions = useMemo(
      () => ({
        renderSideBySide: true,
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        ...options,
      }),
      [options]
    );

    return (
      <MonacoDiffEditorComponent
        height={height}
        theme={theme}
        language={language}
        original={original}
        modified={modified}
        options={computedOptions}
        {...rest}
      />
    );
  }
);

CodeDiffEditor.displayName = 'CodeDiffEditor';
