import { describe, expect, test } from 'vitest';
import { getOSVersion, formatOSVersion } from '../os.js';

describe('OS version detection', () => {
  test.each([
    ['TestBrowser/1.0 (Linux; Android 14; Pixel 8 Build/ABC; wv)', '14'],
    ['TestBrowser/1.0 (Linux; Android 10; Pixel 3 Build/ABC)', '10'],
    [
      'TestBrowser/1.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0.0.0',
      undefined,
    ],
    ['TestBrowser/1.0 (Windows NT 10.0; Win64; x64)', undefined],
    ['TestBrowser/1.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X)', '17.4.1'],
    ['TestBrowser/1.0 (iPad; CPU OS 16_2 like Mac OS X)', '16.2'],
    ['TestBrowser/1.0 (Macintosh; Intel Mac OS X 10_15_7)', undefined],
    ['', undefined],
  ])('reads only usable versions from %s', (ua, expected) => {
    expect(getOSVersion(ua)).toBe(expected);
  });

  test('keeps operating systems distinct and replaces legacy Windows labels', () => {
    expect(formatOSVersion('Android', '14')).toBe('Android 14');
    expect(formatOSVersion('iOS', '14')).toBe('iOS 14');
    expect(formatOSVersion('Windows 10', '11')).toBe('Windows 11');
    expect(formatOSVersion('Android', null)).toBe('Android (Unknown)');
  });
});
