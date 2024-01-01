import { lazy } from 'react';

export const CodeEditor = lazy(() =>
  import('./main').then((m) => ({ default: m.CodeEditor }))
);
