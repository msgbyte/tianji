import { afterEach, describe, expect, test, vi } from 'vitest';
import { initWebsiteTracking, reportWebsiteEvent } from './pure';

describe('initWebsiteTracking', () => {
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
    initWebsiteTracking({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
    });

    await reportWebsiteEvent('pageview');

    await vi.advanceTimersByTimeAsync(999);
    expect(requestedUrls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(requestedUrls).toEqual(['https://example.com/api/website/batch']);
  });
});
