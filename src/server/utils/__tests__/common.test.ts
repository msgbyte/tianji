import { describe, expect, test } from 'vitest';
import { md5 } from '../common.js';

describe('md5', () => {
  test('should return the correct md5 hash', () => {
    const input = 'test';
    const expectedHash = '098f6bcd4621d373cade4e832627b4f6';

    const result = md5(input);

    expect(result).toEqual(expectedHash);
  });

  test('should handle different inputs', () => {
    const input1 = 'hello';
    const input2 = 'world';

    const result1 = md5(input1);
    const result2 = md5(input2);

    expect(result1).not.toEqual(result2);
  });
});
