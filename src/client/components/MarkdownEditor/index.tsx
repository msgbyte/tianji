import loadable from '@loadable/component';
import 'bytemd/dist/index.css';
import './style.less';

export const MarkdownEditor = loadable(() =>
  import('./editor').then((module) => module.MarkdownEditor)
);

export const MarkdownViewer = loadable(() =>
  import('./viewer').then((module) => module.MarkdownViewer)
);
