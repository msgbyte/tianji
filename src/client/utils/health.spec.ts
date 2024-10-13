import { describe, test, expect } from 'vitest';
import {
  parseHealthStatusByPercent,
  getStatusBgColorClassName,
} from './health';

describe('parseHealthStatusByPercent', () => {
  test('should return "health" when percent is 100', () => {
    expect(parseHealthStatusByPercent(100, 0)).toEqual('health');
  });

  test('should return "none" when percent is 0 and count is 0', () => {
    expect(parseHealthStatusByPercent(0, 0)).toEqual('none');
  });

  test('should return "error" when percent is 0 and count is not 0', () => {
    expect(parseHealthStatusByPercent(0, 1)).toEqual('error');
  });

  test('should return "warning" for other cases', () => {
    expect(parseHealthStatusByPercent(50, 1)).toEqual('warning');
  });
});

describe('getStatusBgColorClassName', () => {
  test('should return bg-green-500 for health status', () => {
    expect(getStatusBgColorClassName('health')).toEqual('bg-green-500');
  });

  test('should return bg-red-600 for error status', () => {
    expect(getStatusBgColorClassName('error')).toEqual('bg-red-600');
  });

  test('should return bg-yellow-400 for warning status', () => {
    expect(getStatusBgColorClassName('warning')).toEqual('bg-yellow-400');
  });

  test('should return bg-gray-400 for none status', () => {
    expect(getStatusBgColorClassName('none')).toEqual('bg-gray-400');
  });

  test('should return empty string for other status', () => {
    expect(getStatusBgColorClassName('other' as any)).toEqual('');
  });
});
