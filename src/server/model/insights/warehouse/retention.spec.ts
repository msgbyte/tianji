import { describe, expect, it } from 'vitest';
import { buildRetentionQuery } from './retention.js';
import { unwrapSQL } from '../../../utils/prisma.js';
import dayjs from 'dayjs';

describe('retention', () => {
  describe('buildRetentionQuery', () => {
    it('base', () => {
      const query = buildRetentionQuery(
        '1',
        'wide_table_test',
        dayjs('2025-07-15').valueOf(),
        dayjs('2025-08-02').valueOf()
      );

      expect(query).toBeDefined();
      console.log('query', unwrapSQL(query));
    });
  });
});
