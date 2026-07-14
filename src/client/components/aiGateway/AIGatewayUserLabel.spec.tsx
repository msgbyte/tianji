import { describe, expect, it } from 'vitest';
import { createAIGatewayUserLabelFormatter } from './AIGatewayUserLabel';

describe('createAIGatewayUserLabelFormatter', () => {
  it('prefers a non-empty nickname', () => {
    const format = createAIGatewayUserLabelFormatter([
      { userId: 'user-1', user: { nickname: 'Ada', username: 'ada' } },
    ]);

    expect(format('user-1')).toBe('Ada (user-1)');
  });

  it('falls back to username when nickname is blank', () => {
    const format = createAIGatewayUserLabelFormatter([
      { userId: 'user-2', user: { nickname: '   ', username: 'grace' } },
    ]);

    expect(format('user-2')).toBe('grace (user-2)');
  });

  it('keeps the raw ID for an unknown user', () => {
    const format = createAIGatewayUserLabelFormatter([]);

    expect(format('removed-user')).toBe('removed-user');
  });
});
