import { AIGatewayLogsStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import {
  calcAIGatewayTpot,
  getOpenAIResponsesCompletedResponse,
  getOpenAIResponsesOutputText,
  getOpenAIResponsesStreamDelta,
  getOpenAIResponsesUsage,
  openaiResponsesRequestSchema,
} from './aiGateway.js';
import { aiGatewayRouter } from '../router/aiGateway.js';

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

describe('openaiResponsesRequestSchema', () => {
  test('accepts Responses API payloads and preserves passthrough fields', () => {
    const payload = openaiResponsesRequestSchema.parse({
      model: 'gpt-4.1-mini',
      input: 'Hello',
      instructions: 'Be brief',
      stream: true,
      text: {
        format: {
          type: 'text',
        },
      },
    });

    expect(payload).toEqual({
      model: 'gpt-4.1-mini',
      input: 'Hello',
      instructions: 'Be brief',
      stream: true,
      text: {
        format: {
          type: 'text',
        },
      },
    });
  });
});

describe('getOpenAIResponsesUsage', () => {
  test('maps Responses usage fields to gateway token fields', () => {
    expect(
      getOpenAIResponsesUsage({
        usage: {
          input_tokens: 12,
          output_tokens: 5,
          total_tokens: 17,
          input_tokens_details: {
            cached_tokens: 7,
          },
        },
      })
    ).toEqual({
      inputToken: 12,
      outputToken: 5,
      cacheReadInputToken: 7,
      cacheWriteInputToken: 0,
    });
  });

  test('falls back to zeroes when usage is not available', () => {
    expect(getOpenAIResponsesUsage({})).toEqual({
      inputToken: 0,
      outputToken: 0,
      cacheReadInputToken: 0,
      cacheWriteInputToken: 0,
    });
  });
});

describe('getOpenAIResponsesOutputText', () => {
  test('prefers the SDK output_text helper field', () => {
    expect(
      getOpenAIResponsesOutputText({
        output_text: 'Hello from output_text',
        output: [],
      })
    ).toBe('Hello from output_text');
  });

  test('extracts text from output content when output_text is missing', () => {
    expect(
      getOpenAIResponsesOutputText({
        output: [
          {
            type: 'message',
            content: [
              { type: 'output_text', text: 'Hello ' },
              { type: 'output_text', text: 'world' },
            ],
          },
        ],
      })
    ).toBe('Hello world');
  });
});

describe('OpenAI Responses stream helpers', () => {
  test('extracts output_text delta events', () => {
    expect(
      getOpenAIResponsesStreamDelta({
        type: 'response.output_text.delta',
        delta: 'chunk',
      })
    ).toBe('chunk');
  });

  test('extracts the completed response from stream events', () => {
    const response = {
      id: 'resp_123',
      model: 'gpt-4.1-mini',
      usage: {
        input_tokens: 3,
        output_tokens: 2,
        total_tokens: 5,
      },
    };

    expect(
      getOpenAIResponsesCompletedResponse({
        type: 'response.completed',
        response,
      })
    ).toBe(response);
  });
});

describe('aiGatewayRouter Responses routes', () => {
  function getPostRoutePaths() {
    return (aiGatewayRouter.stack as any[])
      .map((layer) => layer.route)
      .filter((route) => route?.methods?.post)
      .map((route) => route.path);
  }

  test('registers only the current Responses API paths', () => {
    const paths = getPostRoutePaths();

    expect(paths).toContain('/:workspaceId/:gatewayId/openai/v1/responses');
    expect(paths).toContain('/:workspaceId/:gatewayId/custom/v1/responses');
    expect(paths).not.toContain('/v1/:workspaceId/:gatewayId/openai/responses');
    expect(paths).not.toContain('/v1/:workspaceId/:gatewayId/custom/responses');
  });
});
