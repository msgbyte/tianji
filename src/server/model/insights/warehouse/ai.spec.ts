import { describe, expect, it } from 'vitest';
import { env } from '../../../utils/env.js';
import { getWarehouseTables } from './utils.js';

describe.runIf(env.insights.warehouse.enable)('warehouse ai', () => {
  it('getWarehouseTables', async () => {
    const tables = await getWarehouseTables();

    expect(tables).toBeDefined();
  });
});
