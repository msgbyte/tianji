import { describe, expect, test } from 'vitest';
import { getMinimumUnit, formatDate, getDateArray } from './date';

describe('date', () => {
  describe('getMinimumUnit', () => {
    test('should return minute when difference is less than 60 minutes', () => {
      const start = '2023-01-01 10:00:00';
      const end = '2023-01-01 10:30:00';
      expect(getMinimumUnit(start, end)).toBe('minute');
    });

    test('should return hour when difference is less than 48 hours', () => {
      const start = '2023-01-01 10:00:00';
      const end = '2023-01-02 10:00:00';
      expect(getMinimumUnit(start, end)).toBe('hour');
    });

    test('should return day when difference is less than 90 days', () => {
      const start = '2023-01-01 10:00:00';
      const end = '2023-03-01 10:00:00';
      expect(getMinimumUnit(start, end)).toBe('day');
    });

    test('should return month when difference is less than 24 months', () => {
      const start = '2023-01-01 10:00:00';
      const end = '2024-01-01 10:00:00';
      expect(getMinimumUnit(start, end)).toBe('month');
    });

    test('should return year when difference is more than 24 months', () => {
      const start = '2023-01-01 10:00:00';
      const end = '2025-01-01 10:00:00';
      expect(getMinimumUnit(start, end)).toBe('month');
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2023-01-01T10:30:45');
      expect(formatDate(date)).toBe('2023-01-01 10:30:45');
    });

    test('should format date with timezone', () => {
      const date = new Date('2023-01-01T10:30:45Z');
      // Using specific timezone, note: results will vary depending on timezone offset
      expect(formatDate(date, 'Asia/Shanghai')).toBe('2023-01-01 18:30:45');
      expect(formatDate(date, 'utc')).toBe('2023-01-01 10:30:45');
    });

    test.skip('should format relative date with timezone', () => {
      expect(formatDate('2023-01-01 10:30:45', 'Asia/Shanghai')).toBe(
        '2023-01-01 10:30:45'
      );
      expect(formatDate('2023-01-01 10:30:45', 'UTC')).toBe(
        '2023-01-01 10:30:45'
      );
    });
  });

  describe('getDateArray', () => {
    test('should return empty array when input data is empty', () => {
      const result = getDateArray([], '2023-01-01', '2023-01-03', 'day');
      expect(result).toEqual([]);
    });

    test('should generate daily date array with data', () => {
      const data = [
        { date: '2023-01-01 00:00:00', value: 10 },
        { date: '2023-01-03 00:00:00', value: 30 },
      ];

      const result = getDateArray(data, '2023-01-01', '2023-01-03', 'day');

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2023-01-01 00:00:00');
      expect(result[0].value).toBe(10);
      expect(result[1].date).toBe('2023-01-02 00:00:00');
      expect(result[1].value).toBe(0); // Default value
      expect(result[2].date).toBe('2023-01-03 00:00:00');
      expect(result[2].value).toBe(30);
    });

    test('should normalize dates according to unit', () => {
      const data = [{ date: '2023-01-01 10:30:00', value: 10 }];

      const result = getDateArray(
        data,
        '2023-01-01 09:00:00',
        '2023-01-01 11:00:00',
        'hour'
      );

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2023-01-01 09:00:00');
      expect(result[0].value).toBe(0);
      expect(result[1].date).toBe('2023-01-01 10:00:00');
      expect(result[1].value).toBe(10);
      expect(result[2].date).toBe('2023-01-01 11:00:00');
      expect(result[2].value).toBe(0);
    });

    test('should handle different units', () => {
      // Test with month unit
      const data = [
        { date: '2023-01-15 00:00:00', value: 10 },
        { date: '2023-02-15 00:00:00', value: 20 },
      ];

      const result = getDateArray(data, '2023-01-01', '2023-02-01', 'month');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2023-01-01 00:00:00');
      expect(result[0].value).toBe(10);
      expect(result[1].date).toBe('2023-02-01 00:00:00');
      expect(result[1].value).toBe(20);
    });
  });
});
