import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  build: {
    outDir: '../../dist/src/server/public',
  },
  clearScreen: false,
  server: {
    proxy: {
      '/trpc': {
        target: 'http://localhost:12345',
      },
    },
  },
});
