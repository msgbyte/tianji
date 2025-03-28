import { describe, expect, test } from 'vitest';
import {
  hostnameValidator,
  domainValidator,
  urlSlugValidator,
  portValidator,
} from './validator';

// Helper function to simulate form validation call
const runValidator = async (
  validator: any,
  value: any,
  required: boolean = true
) => {
  return new Promise<string | undefined>((resolve) => {
    const rule = { required };
    validator(rule, value, (errorMsg?: string) => {
      resolve(errorMsg);
    });
  });
};

describe('hostnameValidator', () => {
  test('should validate valid hostnames', async () => {
    // Valid hostnames
    expect(await runValidator(hostnameValidator, 'localhost')).toBeUndefined();
    expect(await runValidator(hostnameValidator, 'server-01')).toBeUndefined();
    expect(
      await runValidator(hostnameValidator, 'app.example')
    ).toBeUndefined();
    expect(
      await runValidator(hostnameValidator, 'my-server.company.internal')
    ).toBeUndefined();

    // Valid IP addresses
    expect(await runValidator(hostnameValidator, '127.0.0.1')).toBeUndefined();
    expect(
      await runValidator(hostnameValidator, '192.168.1.1')
    ).toBeUndefined();
    expect(await runValidator(hostnameValidator, '10.0.0.1')).toBeUndefined();
    expect(await runValidator(hostnameValidator, '8.8.8.8')).toBeUndefined();
  });

  test('should invalidate invalid hostnames', async () => {
    // Invalid hostnames
    expect(await runValidator(hostnameValidator, 'invalid hostname')).toBe(
      'Not valid host, it should be ip or hostname'
    );
    expect(await runValidator(hostnameValidator, 'host_name')).toBe(
      'Not valid host, it should be ip or hostname'
    );
    expect(await runValidator(hostnameValidator, '-invalid')).toBe(
      'Not valid host, it should be ip or hostname'
    );
    expect(await runValidator(hostnameValidator, 'invalid-')).toBe(
      'Not valid host, it should be ip or hostname'
    );
    expect(await runValidator(hostnameValidator, '')).toBe(
      'Not valid host, it should be ip or hostname'
    );

    // Invalid IP addresses
    expect(await runValidator(hostnameValidator, '256.0.0.1')).toBe(undefined);
    expect(await runValidator(hostnameValidator, '192.168.01')).toBe(undefined);
    expect(await runValidator(hostnameValidator, '192.168.1.1.5')).toBe(
      undefined
    );
  });
});

describe('domainValidator', () => {
  test('should validate valid domains', async () => {
    expect(await runValidator(domainValidator, 'example.com')).toBeUndefined();
    expect(
      await runValidator(domainValidator, 'sub.example.com')
    ).toBeUndefined();
    expect(
      await runValidator(domainValidator, 'my-domain.com')
    ).toBeUndefined();
    expect(
      await runValidator(domainValidator, 'sub.my-domain.co.uk')
    ).toBeUndefined();
  });

  test('should handle optional domains when not required', async () => {
    expect(await runValidator(domainValidator, '', false)).toBeUndefined();
    expect(await runValidator(domainValidator, null, false)).toBeUndefined();
    expect(
      await runValidator(domainValidator, undefined, false)
    ).toBeUndefined();
  });

  test('should invalidate invalid domains', async () => {
    expect(await runValidator(domainValidator, 'example')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
    expect(await runValidator(domainValidator, 'example.')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
    expect(await runValidator(domainValidator, '.example.com')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
    expect(await runValidator(domainValidator, 'exam ple.com')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
    expect(await runValidator(domainValidator, 'example_com')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
    expect(await runValidator(domainValidator, '')).toBe(
      'Not valid, it should be domain, for example: example.com'
    );
  });
});

describe('urlSlugValidator', () => {
  test('should validate valid slugs', async () => {
    expect(await runValidator(urlSlugValidator, 'my-slug')).toBeUndefined();
    expect(await runValidator(urlSlugValidator, 'blog')).toBeUndefined();
    expect(await runValidator(urlSlugValidator, 'post-2023')).toBeUndefined();
    expect(
      await runValidator(
        urlSlugValidator,
        'a-very-long-url-slug-with-many-words'
      )
    ).toBeUndefined();
  });

  test('should invalidate invalid slugs', async () => {
    expect(await runValidator(urlSlugValidator, 'Invalid_Slug')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, 'invalid slug')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, 'UPPERCASE-SLUG')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, '-invalid')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, 'invalid-')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, 'double--dash')).toBe(
      'Not valid slug'
    );
    expect(await runValidator(urlSlugValidator, '')).toBe('Not valid slug');
  });
});

describe('portValidator', () => {
  test('should validate valid ports', async () => {
    expect(await runValidator(portValidator, 1)).toBeUndefined();
    expect(await runValidator(portValidator, 80)).toBeUndefined();
    expect(await runValidator(portValidator, 443)).toBeUndefined();
    expect(await runValidator(portValidator, 8080)).toBeUndefined();
    expect(await runValidator(portValidator, 65535)).toBeUndefined();
  });

  test('should invalidate invalid ports', async () => {
    expect(await runValidator(portValidator, 0)).toBe(
      'Not valid port, it should be 1 ~ 65535'
    );
    expect(await runValidator(portValidator, 65536)).toBe(
      'Not valid port, it should be 1 ~ 65535'
    );
    expect(await runValidator(portValidator, -1)).toBe(
      'Not valid port, it should be 1 ~ 65535'
    );
    expect(await runValidator(portValidator, '80')).toBe(
      'Not valid port, it should be 1 ~ 65535'
    ); // String instead of number
    expect(await runValidator(portValidator, null)).toBe(
      'Not valid port, it should be 1 ~ 65535'
    );
    expect(await runValidator(portValidator, undefined)).toBe(
      'Not valid port, it should be 1 ~ 65535'
    );
  });
});
