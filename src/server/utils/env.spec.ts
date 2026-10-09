import { afterEach, describe, expect, test, vi } from 'vitest';
import jwt from 'jsonwebtoken';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('JWT_SECRET', () => {
  test('rejects tokens signed with the example placeholder', async () => {
    const placeholder = 'replace-me-with-a-random-string';
    vi.stubEnv('JWT_SECRET', placeholder);
    vi.resetModules();

    const { env } = await import('./env.js');
    const token = jwt.sign({ id: 'test-user' }, placeholder);

    expect(() => jwt.verify(token, env.jwtSecret)).toThrow('invalid signature');
    expect(env.jwtSecret).toMatch(/^[a-f0-9]{64}$/);
  });

  test.each([undefined, ''])(
    'generates a new secret on startup when configured as %s',
    async (value) => {
      vi.stubEnv('JWT_SECRET', value);
      vi.resetModules();

      const { env } = await import('./env.js');
      const token = jwt.sign({ id: 'test-user' }, env.jwtSecret);

      expect(env.jwtSecret).toMatch(/^[a-f0-9]{64}$/);
      expect(jwt.verify(token, env.jwtSecret)).toMatchObject({
        id: 'test-user',
      });

      vi.resetModules();
      const { env: restartedEnv } = await import('./env.js');

      expect(restartedEnv.jwtSecret).not.toBe(env.jwtSecret);
    }
  );

  test('preserves a custom secret exactly', async () => {
    const secret = ' custom-deployment-secret ';
    vi.stubEnv('JWT_SECRET', secret);
    vi.resetModules();

    const { env } = await import('./env.js');

    expect(env.jwtSecret).toBe(secret);
  });
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
