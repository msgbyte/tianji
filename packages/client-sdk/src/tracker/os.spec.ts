import { afterEach, describe, expect, test, vi } from 'vitest';
import { getBrowserOSVersion } from './os';
import { createTrackerCore } from './core';
import {
  initWebsiteTracking,
  reportWebsiteEvent,
  flushBatchQueue,
} from './pure';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mockHints(platform: string, platformVersion: string) {
  const getHighEntropyValues = vi
    .fn()
    .mockResolvedValue({ platform, platformVersion });
  vi.stubGlobal('navigator', {
    userAgentData: { platform, getHighEntropyValues },
  });
  return getHighEntropyValues;
}

describe('browser OS version', () => {
  test.each([
    ['Windows', '13.0.0', '11'],
    ['Windows', '19.0.0', '11'],
    ['Windows', '10.0.0', '10'],
    ['Windows', '0.3.0', undefined],
    ['Android', '14.0.0', '14.0.0'],
    ['macOS', '14.5.0', '14.5.0'],
    ['Linux', '6.8.0', undefined],
    ['Android', '', undefined],
    ['Windows', 'invalid', undefined],
  ])('maps %s %s to %s', async (platform, version, expected) => {
    mockHints(platform, version);
    expect(await getBrowserOSVersion()).toBe(expected);
  });

  test('handles unsupported and denied client hints', async () => {
    vi.stubGlobal('navigator', {});
    expect(await getBrowserOSVersion()).toBeUndefined();
    const getHints = mockHints('Android', '14.0.0');
    getHints.mockRejectedValue(new Error('Permission denied'));
    expect(await getBrowserOSVersion()).toBeUndefined();
  });

  test.each(['core', 'pure'])(
    'includes the OS version in the first %s batch',
    async (mode) => {
      const getHints = mockHints('Windows', '13.0.0');
      const requests: any[] = [];
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        requests.push(JSON.parse(String(init.body)));
        return new Response(null, { status: 200 });
      });
      const options = {
        serverUrl: 'https://example.com',
        websiteId: 'website-id',
      };
      if (mode === 'core') {
        const tracker = createTrackerCore(options);
        tracker.track('first');
        tracker.identify({ id: 'user' });
        await tracker.flush();
      } else {
        initWebsiteTracking(options);
        await reportWebsiteEvent('first');
        await reportWebsiteEvent('second');
        await flushBatchQueue();
      }
      expect(
        requests[0].events.map((item: any) => item.payload.osVersion)
      ).toEqual(['11', '11']);
      expect(getHints).toHaveBeenCalledTimes(1);
    }
  );

  test('sends single events even when client hints never resolve', async () => {
    vi.useFakeTimers();
    mockHints('Android', '14').mockReturnValue(new Promise(() => {}));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const tracker = createTrackerCore({
      serverUrl: 'https://example.com',
      websiteId: 'website-id',
      disableBatch: true,
    });
    tracker.track('first');
    await vi.advanceTimersByTimeAsync(250);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).payload
    ).not.toHaveProperty('osVersion');
  });
});
