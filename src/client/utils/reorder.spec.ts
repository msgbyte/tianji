import { describe, it, expect } from 'vitest';
import { reorder } from './reorder';

describe('reorder', () => {
  it('should correctly reorder elements from a lower index to a higher index', () => {
    const original = [1, 2, 3, 4, 5];
    const result = reorder(original, 0, 3);

    expect(result).toEqual([2, 3, 4, 1, 5]);
    // original array should not be modified
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('should correctly reorder elements from a higher index to a lower index', () => {
    const original = [1, 2, 3, 4, 5];
    const result = reorder(original, 4, 1);

    expect(result).toEqual([1, 5, 2, 3, 4]);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return the same array when start and end indices are the same', () => {
    const original = [1, 2, 3, 4, 5];
    const result = reorder(original, 2, 2);

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an empty array', () => {
    const original: number[] = [];
    const result = reorder(original, 0, 0);

    expect(result).toEqual([undefined]);
    expect(original).toEqual([]);
  });

  it('should work with string arrays', () => {
    const original = ['a', 'b', 'c', 'd', 'e'];
    const result = reorder(original, 1, 3);

    expect(result).toEqual(['a', 'c', 'd', 'b', 'e']);
    expect(original).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should work with object arrays', () => {
    const original = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];
    const result = reorder(original, 0, 2);

    expect(result).toEqual([
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 1, name: 'Item 1' },
    ]);
    expect(original).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]);
  });
});
