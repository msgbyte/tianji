import { describe, expect, test } from 'vitest';
import { getTimezoneList } from './date';

describe('getTimezoneList', () => {
  test('should return timezone list with correct labels and values', () => {
    const result = getTimezoneList();

    expect(result).toMatchSnapshot();
  });
});
