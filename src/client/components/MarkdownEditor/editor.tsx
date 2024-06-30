import React from 'react';
import { Editor, EditorProps } from '@bytemd/react';
import { plugins } from './plugins';
import { useLocale } from './useLocale';

interface MarkdownEditorProps extends EditorProps {}
export const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo(
  (props) => {
    const locale = useLocale();

    return <Editor plugins={plugins} locale={locale} {...props} />;
  }
);
MarkdownEditor.displayName = 'MarkdownEditor';
