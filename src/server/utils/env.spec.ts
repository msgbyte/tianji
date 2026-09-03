import { afterEach, describe, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('AUDIT_LOG_RETENTION_DAYS', () => {
  test('defaults to 30 days', async () => {
    vi.stubEnv('AUDIT_LOG_RETENTION_DAYS', '');
    vi.resetModules();

    const { env } = await import('./env.js');

    expect(env.auditLogRetentionDays).toBe(30);
  });

  test('accepts a positive integer', async () => {
    vi.stubEnv('AUDIT_LOG_RETENTION_DAYS', '45');
    vi.resetModules();

    const { env } = await import('./env.js');

    expect(env.auditLogRetentionDays).toBe(45);
  });

  test.each(['0', '-1', '1.5', 'invalid'])(
    'falls back to 30 days for invalid value %s',
    async (value) => {
      vi.stubEnv('AUDIT_LOG_RETENTION_DAYS', value);
      vi.resetModules();

      const { env } = await import('./env.js');

      expect(env.auditLogRetentionDays).toBe(30);
    }
  );
});
