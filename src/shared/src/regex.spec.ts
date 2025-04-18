import { describe, expect, test } from 'vitest';
import { domainRegex, hostnameRegex, slugRegex } from './regex';

describe('regex', () => {
  describe('domainRegex', () => {
    test.each([
      '555.123.4567',
      'www.demo.com',
      'bar.ba.test.co.uk',
      'g.com',
      'xn--d1ai6ai.xn--p1ai',
      'foodemo.net',
      'sub.example.co.jp',
      'a.io',
      'microsoft.com',
      'dev.azure.com',
    ])('should validate domain: %s', (input) => {
      expect(domainRegex.test(input)).toBe(true);
    });

    test.each([
      'example',
      'example..com',
      '.example.com',
      'example.com.',
      '-example.com',
      'example-.com',
      'example.com-',
      'example.c_m',
      'exa mple.com',
      'a.a',
      '@example.com',
      'example@.com',
    ])('should reject invalid domain: %s', (input) => {
      expect(domainRegex.test(input)).toBe(false);
    });
  });

  describe('hostnameRegex', () => {
    test.each([
      'localhost',
      'server',
      'web-server',
      'web-01',
      'app42',
      'host.local',
      'subdomain.example.com',
      'a.b.c.d.e.f.g',
      'x',
      'X',
      '123',
    ])('should validate hostname: %s', (input) => {
      expect(hostnameRegex.test(input)).toBe(true);
    });

    test.each([
      '',
      'host_name',
      'host name',
      '-hostname',
      'hostname-',
      'host..name',
      '.hostname',
      'hostname.',
      '#hostname',
      'host@name',
      'host:name',
    ])('should reject invalid hostname: %s', (input) => {
      expect(hostnameRegex.test(input)).toBe(false);
    });
  });

  describe('slugRegex', () => {
    test.each([
      'slug',
      'slug-with-hyphens',
      '123',
      'a123',
      '123a',
      'slug-123',
      'a-b-c',
      'a',
      '1',
      'verylongslugwithmanymanycharacters',
    ])('should validate slug: %s', (input) => {
      expect(slugRegex.test(input)).toBe(true);
    });

    test.each([
      '',
      'Slug',
      'SLUG',
      'slug_with_underscore',
      'slug with spaces',
      '-slug',
      'slug-',
      'slug--slug',
      'slug-_-slug',
      '@slug',
      'slug@',
      'slug.name',
    ])('should reject invalid slug: %s', (input) => {
      expect(slugRegex.test(input)).toBe(false);
    });
  });
});
