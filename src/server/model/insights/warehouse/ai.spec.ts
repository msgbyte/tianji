import { describe, expect, it } from 'vitest';
import { getWarehouseTables } from './ai.js';
import { env } from '../../../utils/env.js';

describe.runIf(env.insights.warehouse.enable)('warehouse ai', () => {
  it('getWarehouseTables', async () => {
    const tables = await getWarehouseTables();

    expect(tables).toBeDefined();
  });
});
