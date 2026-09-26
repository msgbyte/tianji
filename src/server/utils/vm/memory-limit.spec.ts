import http from 'http';
import type { AddressInfo } from 'net';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { runCodeInIVM } from './index.js';
import { createSandboxProxy } from './sandbox.js';
import { runWorkerModuleInIVM } from './module.js';

// Many short lines: splitting them is what pushes a log past the limit.
const largeBody = ('x'.repeat(80) + '\n').repeat(300000);
let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url?.startsWith('/large')) {
      res.end(largeBody);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end('{"ok":true}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function createWorkerGlobals() {
  const bridge = createSandboxProxy({
    get: async () => undefined,
    set: async () => true,
    delete: async () => true,
  });
  return { __workerKV: bridge, __workspaceKV: bridge };
}

describe('sandbox memory limit', () => {
  test('reports the memory limit and keeps logs written before it', async () => {
    const result = await runCodeInIVM(`(async () => {
      console.log('before allocation');
      const items = [];
      while (true) items.push('x'.repeat(1024) + Math.random());
    })()`);

    expect(String(result.error)).toContain('memory limit');
    expect(result.logger.map((log) => log[2])).toContain('before allocation');
    expect(result.cpuTime).toBeUndefined();
    expect(result.memoryUsage).toBeUndefined();
  });

  test('names the sandbox requests completed before the memory limit', async () => {
    const result = await runCodeInIVM(`(async () => {
      const small = await request({ url: '${baseUrl}/small?token=secret' });
      if (small.data.ok !== true) throw new Error('JSON response was not parsed');
      const response = await request({ url: '${baseUrl}/large?token=secret', responseType: 'text' });
      return response.data.split('\\n').reverse().length;
    })()`);

    const message = String(result.error);
    expect(message).toContain('memory limit');
    expect(message).toContain(`GET ${baseUrl}/small -> 200, 11 B`);
    expect(message).toContain(`GET ${baseUrl}/large -> 200, 23.2 MB`);
    expect(message).not.toContain('secret');
  });

  test('reports the memory limit for module workers', async () => {
    const result = await runWorkerModuleInIVM(
      `export default {
        async fetch() {
          console.log('fetching log');
          const response = await request({ url: '${baseUrl}/large', responseType: 'text' });
          return response.data.split('\\n').reverse().length;
        }
      };`,
      {
        modules: [],
        globals: createWorkerGlobals(),
        requestPayload: {},
        context: {},
      }
    );

    expect(String(result.error)).toContain(`GET ${baseUrl}/large -> 200, 23.2 MB`);
    expect(result.logger.map((log) => log[2])).toContain('fetching log');
  });
});
