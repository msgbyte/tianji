import React from 'react';
import { Viewer } from '@bytemd/react';
import { plugins } from './plugins';
import { cn } from '@/utils/style';

interface MarkdownViewerProps {
  className?: string;
  value: string;
}
export const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  (props) => {
    return (
      <div className={cn('markdown', props.className)}>
        <Viewer plugins={plugins} value={props.value ?? ''} />
      </div>
    );
  }
);
MarkdownViewer.displayName = 'MarkdownViewer';
