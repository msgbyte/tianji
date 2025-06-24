import { describe, test, expect, beforeEach } from 'vitest';
import { initTianjiTracker } from './tracker';

describe('initTianjiTracker', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  test('simple', async () => {
    const script = await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].async).toBe(true);
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
    });
    expect(script).toBe(scriptDoms[0]);
    expect(script.parentElement).toBe(document.head);
  });

  test('customTrackerName', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      customTrackerName: 'custom.js',
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/custom.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
    });
  });

  test('auto-track set true', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      autoTrack: true,
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
    });
  });

  test('auto-track set false', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      autoTrack: false,
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
      autoTrack: 'false',
    });
  });

  test('domains', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      domains: ['example.com', 'www.example.com'],
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
      domains: 'example.com,www.example.com',
    });
  });

  test('disableTrack', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      disableTrack: true,
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
      doNotTrack: 'true',
    });
  });

  test('autoTrack set true', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      autoTrack: true,
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
    });
  });

  test('autoTrack set false', async () => {
    await initTianjiTracker({
      url: 'https://example.com',
      websiteId: 'fooo',
      autoTrack: false,
    });

    const scriptDoms = document.querySelectorAll('script');
    expect(scriptDoms.length).toBe(1);
    expect(scriptDoms[0].src).toBe('https://example.com/tracker.js');
    expect(scriptDoms[0].dataset).toEqual({
      websiteId: 'fooo',
      autoTrack: 'false',
    });
  });
});
