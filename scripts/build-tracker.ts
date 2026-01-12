import { resolve } from 'path';
import * as vite from 'vite';

console.log('Start Build Tracker');

vite
  .build({
    resolve: {
      alias: {
        'tianji-client-sdk/tracker/core': resolve(
          process.cwd(),
          './packages/client-sdk/src/tracker/core'
        ),
        'tianji-client-sdk': resolve(
          process.cwd(),
          './packages/client-sdk/src'
        ),
      },
    },
    build: {
      lib: {
        entry: resolve(process.cwd(), './src/tracker/index.ts'),
        name: 'tianji',
        fileName: () => 'tracker.js',
        formats: ['iife'],
      },
      emptyOutDir: false,
      outDir: resolve(process.cwd(), './src/client/public'),
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
  })
  .then((res) => {
    console.log('Build Tracker Completed');
  });
