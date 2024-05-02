import { describe, expect, test } from 'vitest';
import { dns } from '../dns';

describe('dns', () => {
  test('run', async () => {
    const res = await dns.run({
      id: '',
      workspaceId: '',
      name: '',
      type: '',
      active: true,
      interval: 0,
      maxRetries: 0,
      trendingMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      payload: {
        hostname: 'tianji.msgbyte.com',
        resolverServer: '1.1.1.1',
        resolverPort: 53,
        rrtype: 'CNAME',
      },
    });

    expect(typeof res).toBe('number');
    expect(res).not.toBe(-1);
  });
});
