import { describe, expect, test } from 'vitest';
import { appendUrlQueryParams, getUrlQueryParams } from './url';

describe('url', () => {
  describe('appendUrlQueryParams', () => {
    test('should add query params to url', () => {
      expect(appendUrlQueryParams('http://example.com', { foo: 'bar' })).toBe(
        'http://example.com/?foo=bar'
      );
    });

    test('should append query params to url', () => {
      expect(
        appendUrlQueryParams('http://example.com?foz=baz', { foo: 'bar' })
      ).toBe('http://example.com/?foz=baz&foo=bar');
    });
  });

  describe('getUrlQueryParams', () => {
    test('should get url query string', () => {
      expect(getUrlQueryParams('http://example.com?foo=bar')).toEqual({
        foo: 'bar',
      });
    });
  });
});
