import React from 'react';
import { Viewer } from '@bytemd/react';
import { plugins } from './plugins';

interface MarkdownViewerProps {
  value: string;
}
export const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  (props) => {
    return (
      <div className="markdown">
        <Viewer plugins={plugins} value={props.value ?? ''} />
      </div>
    );
  }
);
MarkdownViewer.displayName = 'MarkdownViewer';
