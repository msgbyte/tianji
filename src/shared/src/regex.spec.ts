import { describe, expect, test } from 'vitest';
import { domainRegex } from './regex';

describe('regex', () => {
  describe('domainRegex', () => {
    test.each([
      '555.123.4567',
      'www.demo.com',
      'bar.ba.test.co.uk',
      'g.com',
      'xn--d1ai6ai.xn--p1ai',
      'foodemo.net',
    ])('test: %s', (input) => {
      expect(domainRegex.test(input)).toBe(true);
    });
  });
});
