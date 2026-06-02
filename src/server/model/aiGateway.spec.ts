import { AIGatewayLogsStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { calcAIGatewayTpot } from './aiGateway.js';

describe('calcAIGatewayTpot', () => {
  test('returns -1 for non-streaming requests', () => {
    expect(
      calcAIGatewayTpot({
        stream: false,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: 500,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 for failed requests', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Failed,
        duration: 2000,
        ttft: 500,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 when ttft is missing', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: -1,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 when there are not enough output tokens', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: 500,
        outputToken: 1,
      })
    ).toBe(-1);
  });

  test('returns rounded milliseconds per output token after first token', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 1735,
        ttft: 500,
        outputToken: 11,
      })
    ).toBe(124);
  });

  test('returns at least 1ms for valid sub-millisecond averages', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 101,
        ttft: 100,
        outputToken: 20,
      })
    ).toBe(1);
  });

  test('returns 1ms when duration equals ttft', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 500,
        ttft: 500,
        outputToken: 10,
      })
    ).toBe(1);
  });
});
