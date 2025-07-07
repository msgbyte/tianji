import { describe, expect, test } from 'vitest';
import { isValidFilterValue } from './common';

describe('isValidFilterValue', () => {
  describe('should return true for valid values', () => {
    test('should validate string values', () => {
      const validStrings = [
        'hello',
        'world',
        '',
        'some long string with spaces',
        '123',
        'special-chars_!@#$%^&*()',
        'unicode 中文',
        'json string',
      ];

      validStrings.forEach((input) => {
        expect(isValidFilterValue(input)).toBe(true);
      });
    });

    test('should validate number values', () => {
      const validNumbers = [
        0,
        1,
        -1,
        123,
        -456,
        0.5,
        -0.5,
        Math.PI,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Infinity,
        -Infinity,
        NaN, // NaN is typeof 'number'
      ];

      validNumbers.forEach((input) => {
        expect(isValidFilterValue(input)).toBe(true);
      });
    });

    test('should validate empty array', () => {
      expect(isValidFilterValue([])).toBe(true);
    });

    test('should validate string arrays', () => {
      const validStringArrays = [
        ['hello'],
        ['hello', 'world'],
        ['', 'non-empty'],
        ['one', 'two', 'three'],
        ['unicode', '中文', 'mixed'],
      ];

      validStringArrays.forEach((input) => {
        expect(isValidFilterValue(input)).toBe(true);
      });
    });

    test('should validate number arrays', () => {
      const validNumberArrays = [
        [1],
        [1, 2, 3],
        [0, -1, 0.5],
        [-100, 200, -300],
        [Math.PI, Math.E],
        [NaN], // NaN is typeof 'number'
      ];

      validNumberArrays.forEach((input) => {
        expect(isValidFilterValue(input)).toBe(true);
      });
    });

    test('should validate mixed string and number arrays', () => {
      // The function implementation actually allows mixed arrays
      // even though the TypeScript type definition doesn't
      const mixedArrays = [
        ['hello', 123],
        [1, 'world', 2],
        ['', 0, 'test', -1],
        ['mixed', 42, 'array', 3.14],
        ['string', NaN],
        [NaN, 'string'],
      ];

      mixedArrays.forEach((input) => {
        expect(isValidFilterValue(input as any)).toBe(true);
      });
    });
  });

  describe('should return false for invalid values', () => {
    test('should reject invalid types', () => {
      const invalidTypes = [
        true,
        false,
        null,
        undefined,
        {},
        { key: 'value' },
        new Date(),
        /regex/,
        () => {},
        Symbol('test'),
      ];

      invalidTypes.forEach((input) => {
        expect(isValidFilterValue(input as any)).toBe(false);
      });
    });

    test('should reject arrays with invalid elements', () => {
      const invalidArrays = [
        [true],
        [null],
        [undefined],
        [{}],
        [[]],
        [{ key: 'value' }],
        [new Date()],
        [/regex/],
        [() => {}],
        // Mixed valid and invalid elements
        ['hello', true],
        [1, null],
        ['test', undefined],
        [42, {}],
        ['valid', 'string', null],
        [1, 2, false],
      ];

      invalidArrays.forEach((input) => {
        expect(isValidFilterValue(input as any)).toBe(false);
      });
    });

    test('should reject nested arrays', () => {
      const nestedArrays = [
        [['nested']],
        [
          [1, 2],
          [3, 4],
        ],
        [['a'], ['b']],
      ];

      nestedArrays.forEach((input) => {
        expect(isValidFilterValue(input as any)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    test('should handle very large arrays', () => {
      const largeStringArray = new Array(1000).fill('test');
      expect(isValidFilterValue(largeStringArray)).toBe(true);

      const largeNumberArray = new Array(1000).fill(42);
      expect(isValidFilterValue(largeNumberArray)).toBe(true);
    });

    test('should handle arrays with mixed valid types should return true', () => {
      // The function implementation allows mixed arrays despite the type definition
      const mixedArray = ['a', 1, 'b', 2, 'c', 3];
      expect(isValidFilterValue(mixedArray as any)).toBe(true);
    });

    test('should handle special number values', () => {
      // NaN is typeof 'number' so it should be valid
      expect(isValidFilterValue(NaN)).toBe(true);

      // Arrays with NaN mixed with strings should also be valid
      expect(isValidFilterValue(['string', NaN] as any)).toBe(true);
      expect(isValidFilterValue([NaN, 'string'] as any)).toBe(true);
    });
  });
});
