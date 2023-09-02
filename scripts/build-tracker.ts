import { resolve } from 'path';
import vite from 'vite';

console.log('Start Build Tracker');

vite
  .build({
    build: {
      lib: {
        entry: resolve(__dirname, '../src/tracker/index.js'),
        name: 'tianji',
        fileName: () => 'tracker.js',
        formats: ['iife'],
      },
      emptyOutDir: false,
    },
  })
  .then((res) => {
    console.log('Build Tracker Completed');
  });
