import loadable from '@loadable/component';

export const CodeEditor = loadable(() =>
  import('./main').then((m) => ({ default: m.CodeEditor }))
);

export const JsonEditor = loadable(() =>
  import('./json').then((m) => ({ default: m.JsonEditor }))
);
