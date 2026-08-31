import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTrackerCore } from './core';

describe('createTrackerCore', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('sends the default website batch after 1000ms', async () => {
    vi.useFakeTimers();
    const requestedUrls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrls.push(url);
      return new Response(null, { status: 200 });
    });
    const tracker = createTrackerCore({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
    });

    tracker.track('pageview');

    await vi.advanceTimersByTimeAsync(999);
    expect(requestedUrls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(requestedUrls).toEqual(['https://example.com/api/website/batch']);
  });

  test('adds the identified user id to later events', async () => {
    const requests: any[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 200 });
    });
    const tracker = createTrackerCore({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
    });

    tracker.identify({ id: 'user-1' });
    tracker.track('pageview');
    await tracker.flush();

    expect(requests[0].events[1].payload.distinctId).toBe('user-1');
  });

  test('supports the documented userId field', async () => {
    const requests: any[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 200 });
    });
    const tracker = createTrackerCore({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
    });

    tracker.identify({ userId: 'user-1' });
    tracker.track('pageview');
    await tracker.flush();

    expect(requests[0].events[1].payload.distinctId).toBe('user-1');
  });

  test('falls back to session identity when identify omits a user id', async () => {
    const requests: any[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 200 });
    });
    const tracker = createTrackerCore({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
    });

    tracker.identify({ id: 'user-1' });
    tracker.identify({ plan: 'free' });
    tracker.track('pageview');
    await tracker.flush();

    expect(requests[0].events[2].payload).not.toHaveProperty('distinctId');
  });
});
