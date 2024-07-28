import { describe, expect, test } from 'vitest';
import { md5 } from '../common.js';

describe('md5', () => {
  test('normal test', async () => {
    expect(md5('Hello world')).toBe('3e25960a79dbc69b674cd4ec67a72c62');
  });
});
