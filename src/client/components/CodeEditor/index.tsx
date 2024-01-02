import loadable from '@loadable/component';

export const CodeEditor = loadable(() =>
  import('./main').then((m) => ({ default: m.CodeEditor }))
);
