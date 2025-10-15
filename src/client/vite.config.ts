/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon

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
      '/api/insights/': {
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
      '/s/': {
        target: 'http://localhost:12345',
      },
      '^/monitor/.*/badge\\.svg(\\?.*)?$': {
        target: 'http://localhost:12345',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    workspace: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
