import { resolve } from 'path';
import * as vite from 'vite';

console.log('Start Build Tracker');

vite
  .build({
    build: {
      lib: {
        entry: resolve(process.cwd(), './src/tracker/index.ts'),
        name: 'tianji',
        fileName: () => 'tracker.js',
        formats: ['iife'],
      },
      emptyOutDir: false,
      outDir: resolve(process.cwd(), './src/client/public'),
    },
  })
  .then((res) => {
    console.log('Build Tracker Completed');
  });
