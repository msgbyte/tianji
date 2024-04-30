import React from 'react';
import { Viewer } from '@bytemd/react';
import { plugins } from './plugins';
import 'bytemd/dist/index.css';
import './style.less';

interface MarkdownViewerProps {
  value: string;
}
export const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  (props) => {
    return <Viewer plugins={plugins} value={props.value ?? ''} />;
  }
);
MarkdownViewer.displayName = 'MarkdownViewer';
