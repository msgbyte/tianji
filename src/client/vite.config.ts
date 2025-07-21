import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    // @ts-ignore
    TanStackRouterVite({
      routesDirectory: './routes',
      generatedRouteTree: './routeTree.gen.ts',
    }),
  ],
  build: {
    outDir: '../server/public',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:12345',
        changeOrigin: true,
        ws: true,
      },
      '/trpc': {
        target: 'http://localhost:12345',
      },
      '/open': {
        target: 'http://localhost:12345',
      },
      '/lh': {
        target: 'http://localhost:12345',
      },
      '/api/ai/': {
        target: 'http://localhost:12345',
      },
      '/api/auth/': {
        target: 'http://localhost:12345',
      },
      '/api/workspace': {
        target: 'http://localhost:12345',
      },
      '/api/website/send': {
        target: 'http://localhost:12345',
      },
      '/api/push': {
        target: 'http://localhost:12345',
      },
      '/api/worker': {
        target: 'http://localhost:12345',
      },
      '^/monitor/.*/badge\\.svg(\\?.*)?$': {
        target: 'http://localhost:12345',
      },
    },
  },
});
