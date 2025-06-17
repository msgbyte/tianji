import { describe, expect, test, vi } from 'vitest';
import { http } from '../http.js';

// Mock the saveMonitorStatus function to avoid database calls
vi.mock('../_utils.js', () => ({
  saveMonitorStatus: vi.fn().mockResolvedValue(null),
}));

// Mock the updateMonitorErrorMessage function to avoid database calls
vi.mock('../index.js', () => ({
  updateMonitorErrorMessage: vi.fn().mockResolvedValue(undefined),
}));

describe('http', () => {
  test('run', async () => {
    const res = await http.run({
      id: '',
      workspaceId: '',
      name: '',
      type: '',
      active: true,
      interval: 0,
      maxRetries: 0,
      trendingMode: false,
      recentError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      payload: {
        url: 'https://tianji.msgbyte.com',
        method: 'GET',
        timeout: 30,
        contentType: 'application/json',
        bodyValue: '',
        maxRedirects: 5,
        ignoreTLS: false,
        validStatusCodes: [200],
      },
    });

    expect(typeof res).toBe('number');
    expect(res).not.toBe(-1);
  });
});
