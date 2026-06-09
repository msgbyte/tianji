import { describe, expect, test } from 'vitest';
import {
  buildPricingRowsFromModelCost,
  buildStrategyTextFromPricingRows,
  parsePricingRowsFromStrategyText,
} from './AIGatewayStrategyEditor.utils';

describe('AIGatewayStrategyEditor utilities', () => {
  test('parses pricing tiers from strategy JSON', () => {
    expect(
      parsePricingRowsFromStrategyText(
        JSON.stringify({
          price: [
            {
              inputTokenMin: 0,
              inputTokenMax: 200000,
              input: 3,
              output: 15,
              cacheRead: 0.3,
            },
            {
              inputTokenMin: 200001,
              inputTokenMax: null,
              input: 6,
              output: 22.5,
              cacheRead: 0.6,
            },
          ],
        })
      )
    ).toEqual([
      {
        inputTokenMin: 0,
        inputTokenMax: 200000,
        input: 3,
        output: 15,
        cacheRead: 0.3,
      },
      {
        inputTokenMin: 200001,
        inputTokenMax: null,
        input: 6,
        output: 22.5,
        cacheRead: 0.6,
      },
    ]);
  });

  test('writes pricing tiers while preserving other strategy fields', () => {
    const text = buildStrategyTextFromPricingRows(
      [
        {
          inputTokenMin: 0,
          inputTokenMax: null,
          input: 1.25,
          output: 4.5,
          cacheRead: 0.2,
        },
      ],
      JSON.stringify({
        route: {
          provider: 'custom',
        },
        price: [],
      })
    );

    expect(JSON.parse(text)).toEqual({
      route: {
        provider: 'custom',
      },
      price: [
        {
          inputTokenMin: 0,
          inputTokenMax: null,
          input: 1.25,
          output: 4.5,
          cacheRead: 0.2,
        },
      ],
    });
  });

  test('returns empty text when rows are empty and there is no other strategy field', () => {
    expect(buildStrategyTextFromPricingRows([], '')).toBe('');
  });

  test('builds a single pricing row from model pricing config', () => {
    expect(
      buildPricingRowsFromModelCost({
        input: 1.25,
        output: 10,
        cache_read: 0.125,
      })
    ).toEqual([
      {
        inputTokenMin: 0,
        inputTokenMax: null,
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
      },
    ]);
  });

  test('builds 200K pricing tiers from model pricing config', () => {
    expect(
      buildPricingRowsFromModelCost({
        input: 3,
        output: 15,
        cache_read: 0.3,
        cache_write: 3.75,
        context_over_200k: {
          input: 6,
          output: 22.5,
          cache_read: 0.6,
          cache_write: 7.5,
        },
      })
    ).toEqual([
      {
        inputTokenMin: 0,
        inputTokenMax: 200000,
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75,
      },
      {
        inputTokenMin: 200001,
        inputTokenMax: null,
        input: 6,
        output: 22.5,
        cacheRead: 0.6,
        cacheWrite: 7.5,
      },
    ]);
  });
});
