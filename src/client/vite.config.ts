import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  build: {
    outDir: '../server/public',
  },
  clearScreen: false,
  server: {
    // host: '0.0.0.0',
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:12345',
        changeOrigin: true,
        ws: true,
      },
      '/trpc': {
        target: 'http://localhost:12345',
      },
      '/api/workspace': {
        target: 'http://localhost:12345',
      },
    },
  },
});
