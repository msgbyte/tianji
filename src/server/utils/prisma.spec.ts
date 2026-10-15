import { describe, expect, test } from 'vitest';
import {
  getDateQuery,
  getTelemetryFilterQuery,
  getWebsiteClickHouseFilterQuery,
  getWebsiteFilterQuery,
} from './prisma.js';

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
      getDateQuery(
        '"createdAt") x, (SELECT current_database()) --',
        'day',
        'UTC'
      )
    ).toThrow('Invalid SQL identifier path');
  });
});

describe('getWebsiteFilterQuery', () => {
  test('binds the filter value, not the filter name', () => {
    const query = getWebsiteFilterQuery({ country: 'GB', url: '/' });

    expect(query.text).toBe(
      'AND "country" = $1::varchar\nAND "urlPath" = $2::varchar'
    );
    expect(query.values).toEqual(['GB', '/']);
  });

  test('keeps a malicious value out of the SQL text', () => {
    const value = "x' OR '1'='1";
    const query = getWebsiteFilterQuery({ city: value });

    expect(query.text).toBe('AND "city" = $1::varchar');
    expect(query.values).toEqual([value]);
  });

  test('maps utm filters to their columns', () => {
    const query = getWebsiteFilterQuery({ utm_source: 'newsletter' });

    expect(query.text).toBe('AND "utmSource" = $1::varchar');
    expect(query.values).toEqual(['newsletter']);
  });

  test('binds the website domain in the referrer clause', () => {
    const query = getWebsiteFilterQuery(
      { referrer: 'www.google.com' },
      {},
      'example.com'
    );

    expect(query.text).toContain('"referrerDomain" = $1::varchar');
    expect(query.text).toContain('"referrerDomain" != $2');
    expect(query.values).toEqual(['www.google.com', 'example.com']);
  });

  test('skips undefined values and non-filter keys', () => {
    const query = getWebsiteFilterQuery({
      startDate: new Date('2024-01-01T00:00:00Z'),
      timezone: 'UTC',
      country: undefined,
      os: 'Linux',
    });

    expect(query.text).toBe('AND "os" = $1::varchar');
    expect(query.values).toEqual(['Linux']);
  });

  test('is empty without filters', () => {
    expect(getWebsiteFilterQuery({}).text).toBe('');
  });
});

describe('getWebsiteClickHouseFilterQuery', () => {
  test('passes values as query params', () => {
    const value = "GB' OR 1=1 --";
    const query = getWebsiteClickHouseFilterQuery({
      country: value,
      utm_source: 'newsletter',
    });

    expect(query.sql).toBe(
      'AND country = {filter_0:String}\nAND utmSource = {filter_1:String}'
    );
    expect(query.sql).not.toContain('OR 1=1');
    expect(query.params).toEqual({
      filter_0: value,
      filter_1: 'newsletter',
    });
  });

  test('passes the website domain for the referrer clause', () => {
    const query = getWebsiteClickHouseFilterQuery(
      { referrer: 'www.google.com' },
      {},
      'example.com'
    );

    expect(query.sql).toContain('referrerDomain = {filter_0:String}');
    expect(query.sql).toContain(
      'referrerDomain != {filter_websiteDomain:String}'
    );
    expect(query.params).toEqual({
      filter_0: 'www.google.com',
      filter_websiteDomain: 'example.com',
    });
  });
});

describe('getTelemetryFilterQuery', () => {
  test('binds the filter value', () => {
    const query = getTelemetryFilterQuery({ country: 'PL' });

    expect(query.text).toBe('AND "country" = $1::varchar');
    expect(query.values).toEqual(['PL']);
  });
});
