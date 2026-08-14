import { describe, expect, test } from 'vitest';
import {
  toSafeWorkerEnvironmentVariable,
  workerEnvironmentVariablesInputSchema,
} from './environment.js';

describe('worker environment variable contract', () => {
  test('returns a Text value', () => {
    expect(
      toSafeWorkerEnvironmentVariable({
        id: 'env_text',
        key: 'API_URL',
        type: 'Text',
        value: 'https://example.com',
      })
    ).toEqual({
      id: 'env_text',
      key: 'API_URL',
      type: 'Text',
      value: 'https://example.com',
    });
  });

  test('omits a Secret value from the response object', () => {
    const result = toSafeWorkerEnvironmentVariable({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      value: 'do-not-return',
    });

    expect(result).toEqual({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      hasValue: true,
    });
    expect(JSON.stringify(result)).not.toContain('do-not-return');
    expect(result).not.toHaveProperty('value');
  });

  test.each(['1TOKEN', 'API-TOKEN', 'API TOKEN'])('rejects invalid key %s', (key) => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key, type: 'Text', value: 'value' },
      ])
    ).toThrow();
  });

  test('rejects duplicate keys', () => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key: 'API_URL', type: 'Text', value: 'one' },
        { key: 'API_URL', type: 'Secret', value: 'two' },
      ])
    ).toThrow('Environment variable keys must be unique');
  });
});
