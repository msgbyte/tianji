import { afterEach, expect, test, vi } from 'vitest';
import {
  initApplication,
  identifyApplicationUser,
  reportApplicationEvent,
  flushApplicationBatchQueue,
} from './application';

afterEach(() => vi.unstubAllGlobals());

test.each([false, true])(
  'retains OS metadata across application events (single: %s)',
  async (disableBatch) => {
    const requests: any[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 200 });
    });
    const options = {
      serverUrl: 'https://example.com',
      applicationId: 'app',
      disableBatch,
    };
    initApplication(options);
    await identifyApplicationUser({
      os: 'android',
      osVersion: '14',
      version: '2.0',
    });
    await identifyApplicationUser({ id: 'user' });
    await reportApplicationEvent('first');
    await flushApplicationBatchQueue();

    const items = disableBatch ? requests : requests[0].events;
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.payload).toMatchObject({ os: 'android', osVersion: '14' });
    }
    expect(items[0].payload.data.version).toBe('2.0');

    requests.length = 0;
    initApplication({ ...options, applicationId: 'other-app' });
    await reportApplicationEvent('second');
    await flushApplicationBatchQueue();
    const next = disableBatch ? requests[0] : requests[0].events[0];
    expect(next.payload).not.toHaveProperty('osVersion');
  }
);
