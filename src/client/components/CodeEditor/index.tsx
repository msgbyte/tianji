import loadable from '@loadable/component';

export const CodeEditor = loadable(() =>
  import('./main').then((m) => ({ default: m.CodeEditor }))
);

export const CodeDiffEditor = loadable(() =>
  import('./diff').then((m) => ({ default: m.CodeDiffEditor }))
);

export const JsonEditor = loadable(() =>
  import('./json').then((m) => ({ default: m.JsonEditor }))
);

export const SQLEditor = loadable(() =>
  import('./sql').then((m) => ({ default: m.SQLEditor }))
);

export type { SQLTableSchema } from './sql';
