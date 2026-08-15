import { describe, expect, test } from 'vitest';
import { fetchValidator } from './fetch';

describe('fetchValidator', () => {
  test('accepts Module Worker exports', () => {
    expect(
      fetchValidator(
        `export default { async fetch(payload, context) { return payload; } } satisfies TianjiWorker;`
      )
    ).toEqual({ isValid: true, errors: [] });
  });

  test('continues to accept legacy fetch functions', () => {
    expect(fetchValidator(`async function fetch(payload) { return payload; }`))
      .toEqual({ isValid: true, errors: [] });
  });

  test('rejects code without a worker entry', () => {
    expect(fetchValidator(`const value = 1;`).isValid).toBe(false);
  });
});
