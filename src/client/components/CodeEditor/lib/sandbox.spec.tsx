import { describe, expect, test } from 'vitest';
import { sandboxGlobal } from './sandbox';

describe('Worker sandbox declarations', () => {
  test('declares the two-level KV API', () => {
    expect(sandboxGlobal).toContain('interface KVScope');
    expect(sandboxGlobal).toContain('Promise<T | undefined>');
    expect(sandboxGlobal).toContain('ttl?: number');
    expect(sandboxGlobal).toContain('declare const kv: KVScope &');
    expect(sandboxGlobal).toContain('workspace: KVScope');
  });
});
