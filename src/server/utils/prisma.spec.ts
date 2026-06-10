import { describe, expect, test } from 'vitest';
import { getDateQuery } from './prisma.js';

describe('getDateQuery', () => {
  test('binds malicious timezone as a value instead of SQL text', () => {
    const timezone =
      "UTC'), 'YYYY-MM-DD') x, (SELECT current_database()) as injected, --";
    const query = getDateQuery('"WebsiteEvent"."createdAt"', 'day', timezone);

    expect(query.sql).not.toContain('current_database');
    expect(query.sql).not.toContain('injected');
    expect(query.values).toContain(timezone);
  });

  test('builds normal timezone date query with bound values', () => {
    const query = getDateQuery('"createdAt"', 'hour', 'UTC');

    expect(query.sql).toContain('to_char(date_trunc');
    expect(query.sql).toContain('at time zone');
    expect(query.values).toEqual(['hour', 'UTC', 'YYYY-MM-DD HH24:00:00']);
  });

  test('rejects unsafe field paths', () => {
    expect(() =>
      getDateQuery('"createdAt") x, (SELECT current_database()) --', 'day', 'UTC')
    ).toThrow('Invalid SQL identifier path');
  });
});
