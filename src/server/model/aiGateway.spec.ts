import { AIGatewayLogsStatus } from '@prisma/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AI_GATEWAY_STREAM_PING_COMMENT,
  AI_GATEWAY_STREAM_PING_INTERVAL_MS,
  buildAnthropicHandler,
  calcAIGatewayCustomModelPrice,
  calcAIGatewayTpot,
  getAIGatewayErrorStatusCode,
  getAIGatewayUsage,
  mergeAIGatewayStreamUsage,
  getOpenAIResponsesCompletedResponse,
  getOpenAIResponsesOutputText,
  getOpenAIResponsesStreamDelta,
  getOpenAIResponsesUsage,
  openaiResponsesRequestSchema,
  startAIGatewayStreamKeepAlive,
  trackAIGatewayPendingLog,
  writeAIGatewayAnthropicStreamError,
} from './aiGateway.js';
import { aiGatewayRouter } from '../router/aiGateway.js';
import { prisma } from './_client.js';

vi.mock('./_client.js', () => ({
  prisma: {
    aIGateway: {
      findUnique: vi.fn(),
    },
    aIGatewayLogs: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('calcAIGatewayCustomModelPrice', () => {
  test('uses strategy price before deprecated SQL price fields', () => {
    const price = calcAIGatewayCustomModelPrice({
      inputToken: 1000,
      outputToken: 2000,
      cacheReadInputToken: 500,
      customModelStrategy: {
        price: {
          input: 3,
          output: 15,
          cacheRead: 0.3,
        },
      },
      customModelInputPrice: 100,
      customModelOutputPrice: 100,
    });

    expect(price?.toNumber()).toBe(0.03315);
  });

  test('includes cache write tokens from strategy price', () => {
    const price = calcAIGatewayCustomModelPrice({
      inputToken: 1000,
      outputToken: 2000,
      cacheReadInputToken: 500,
      cacheWriteInputToken: 300,
      customModelStrategy: {
        price: {
          input: 3,
          output: 15,
          cacheRead: 0.3,
          cacheWrite: 3.75,
        },
      },
      customModelInputPrice: 100,
      customModelOutputPrice: 100,
    });

    expect(price?.toNumber()).toBe(0.034275);
  });

  test('selects the matching strategy price tier by input token count', () => {
    const price = calcAIGatewayCustomModelPrice({
      inputToken: 250000,
      outputToken: 1000,
      cacheReadInputToken: 1000,
      customModelStrategy: {
        price: [
          {
            inputTokenMax: 200000,
            input: 3,
            output: 15,
            cacheRead: 0.3,
          },
          {
            inputTokenMin: 200001,
            input: 6,
            output: 22.5,
            cacheRead: 0.6,
          },
        ],
      },
      customModelInputPrice: 3,
      customModelOutputPrice: 15,
    });

    expect(price?.toNumber()).toBe(1.5231);
  });

  test('falls back to deprecated SQL price fields when strategy price is missing', () => {
    const price = calcAIGatewayCustomModelPrice({
      inputToken: 1000,
      outputToken: 2000,
      cacheReadInputToken: 500,
      customModelStrategy: null,
      customModelInputPrice: 3,
      customModelOutputPrice: 15,
    });

    expect(price?.toNumber()).toBe(0.033);
  });

  test('returns null when neither strategy nor deprecated SQL price fields are configured', () => {
    const price = calcAIGatewayCustomModelPrice({
      inputToken: 1000,
      outputToken: 2000,
      cacheReadInputToken: 500,
      customModelStrategy: null,
      customModelInputPrice: null,
      customModelOutputPrice: null,
    });

    expect(price).toBeNull();
  });
});

describe('getAIGatewayUsage', () => {
  test('maps Anthropic cache creation tokens to cache write tokens', () => {
    expect(
      getAIGatewayUsage({
        input_tokens: 12,
        output_tokens: 5,
        cache_read_input_tokens: 7,
        cache_creation_input_tokens: 3,
      })
    ).toEqual({
      inputToken: 12,
      outputToken: 5,
      cacheReadInputToken: 7,
      cacheWriteInputToken: 3,
    });
  });

  test('maps OpenAI-compatible cache write aliases', () => {
    expect(
      getAIGatewayUsage({
        prompt_tokens: 20,
        completion_tokens: 9,
        prompt_tokens_details: {
          cached_tokens: 4,
          cache_creation_tokens: 6,
        },
      })
    ).toEqual({
      inputToken: 20,
      outputToken: 9,
      cacheReadInputToken: 4,
      cacheWriteInputToken: 6,
    });
  });

  test('maps direct cache write aliases', () => {
    expect(
      getAIGatewayUsage({
        input_tokens: 20,
        output_tokens: 9,
        cache_read_input_tokens: 4,
        cache_write_input_tokens: 6,
      })
    ).toEqual({
      inputToken: 20,
      outputToken: 9,
      cacheReadInputToken: 4,
      cacheWriteInputToken: 6,
    });
  });
});

describe('mergeAIGatewayStreamUsage', () => {
  test('keeps Anthropic message_start cache usage when message_delta only reports output tokens', () => {
    const initialUsage = mergeAIGatewayStreamUsage(
      {
        inputToken: 0,
        outputToken: 0,
        cacheReadInputToken: 0,
        cacheWriteInputToken: 0,
      },
      {
        input_tokens: 8,
        output_tokens: 1,
        cache_read_input_tokens: 1800,
        cache_creation_input_tokens: 248,
      }
    );

    expect(
      mergeAIGatewayStreamUsage(initialUsage, {
        output_tokens: 503,
      })
    ).toEqual({
      inputToken: 8,
      outputToken: 503,
      cacheReadInputToken: 1800,
      cacheWriteInputToken: 248,
    });
  });
});

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

describe('AI Gateway stream keepalive', () => {
  test('writes SSE ping comments immediately and on the configured interval', () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const res = {
      write: vi.fn((chunk: string) => {
        writes.push(chunk);
        return true;
      }),
      flush: vi.fn(),
    };

    const stop = startAIGatewayStreamKeepAlive(res as any, {
      intervalMs: AI_GATEWAY_STREAM_PING_INTERVAL_MS,
      writeInitial: true,
    });

    expect(writes).toEqual([AI_GATEWAY_STREAM_PING_COMMENT]);
    expect(res.flush).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(AI_GATEWAY_STREAM_PING_INTERVAL_MS);
    expect(writes).toEqual([
      AI_GATEWAY_STREAM_PING_COMMENT,
      AI_GATEWAY_STREAM_PING_COMMENT,
    ]);
    expect(res.flush).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(AI_GATEWAY_STREAM_PING_INTERVAL_MS);
    expect(writes).toHaveLength(2);
  });

  test('stops keepalive when writing a ping fails', () => {
    vi.useFakeTimers();
    const res = {
      write: vi.fn(() => {
        throw new Error('client disconnected');
      }),
      flush: vi.fn(),
    };

    expect(() =>
      startAIGatewayStreamKeepAlive(res as any, {
        intervalMs: AI_GATEWAY_STREAM_PING_INTERVAL_MS,
        writeInitial: true,
      })
    ).not.toThrow();

    expect(res.write).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(AI_GATEWAY_STREAM_PING_INTERVAL_MS);
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.flush).not.toHaveBeenCalled();
  });

  test('writes Anthropic-compatible stream errors for Messages clients', () => {
    const writes: string[] = [];
    const res = {
      write: vi.fn((chunk: string) => {
        writes.push(chunk);
        return true;
      }),
      end: vi.fn(),
    };

    writeAIGatewayAnthropicStreamError(
      res as any,
      new Error('upstream overloaded')
    );

    expect(writes).toEqual([
      'event: error\n',
      'data: {"type":"error","error":{"type":"server_error","message":"upstream overloaded"}}\n\n',
    ]);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('Anthropic stream handler sends an initial ping before upstream responds', async () => {
    vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.aIGatewayLogs.create).mockResolvedValue({
      id: 'log1',
    } as any);
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));

    const writes: string[] = [];
    const req = {
      params: {
        workspaceId: 'workspace1',
        gatewayId: 'gateway1',
      },
      headers: {
        'x-api-key': 'sk-test',
      },
      body: {
        model: 'claude-3-5-sonnet-latest',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 16,
        stream: true,
      },
    };
    const res = {
      setHeader: vi.fn(),
      write: vi.fn((chunk: string) => {
        writes.push(chunk);
        return true;
      }),
      flush: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
      writableEnded: false,
      destroyed: false,
    };
    res.status.mockReturnValue(res);

    const handler = buildAnthropicHandler({
      baseUrl: 'https://anthropic.example/v1',
      fetch: fetchMock as typeof fetch,
    });
    void handler(req as any, res as any, vi.fn());

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(writes[0]).toBe(AI_GATEWAY_STREAM_PING_COMMENT);
    expect(res.flush).toHaveBeenCalledTimes(1);
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
            cache_creation_tokens: 4,
          },
        },
      })
    ).toEqual({
      inputToken: 12,
      outputToken: 5,
      cacheReadInputToken: 7,
      cacheWriteInputToken: 4,
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

describe('AI Gateway runtime metadata helpers', () => {
  test('preserves numeric upstream error status codes', () => {
    expect(getAIGatewayErrorStatusCode({ status: 400 })).toBe(400);
    expect(getAIGatewayErrorStatusCode({ status: 401 })).toBe(401);
    expect(getAIGatewayErrorStatusCode({ status: 403 })).toBe(403);
    expect(getAIGatewayErrorStatusCode({ status: 404 })).toBe(404);
    expect(getAIGatewayErrorStatusCode({ status: 422 })).toBe(422);
    expect(getAIGatewayErrorStatusCode({ status: '429' })).toBe(500);
  });

  test('notifies request-scoped listeners when a gateway log is created', async () => {
    const log = {
      id: 'gateway-log1',
    };
    const observedLogs: unknown[] = [];
    const req = {
      __onAIGatewayLogCreated: (createdLog: unknown) => {
        observedLogs.push(createdLog);
      },
    } as any;

    const trackedLog = await trackAIGatewayPendingLog(
      req,
      Promise.resolve(log as any)
    );

    expect(trackedLog).toBe(log);
    expect(observedLogs).toEqual([log]);
    await expect(req.__aiGatewayLogPromise).resolves.toBe(log);
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

describe('aiGatewayRouter runtime route coverage', () => {
  function getRoutePaths(method: 'get' | 'post') {
    return (aiGatewayRouter.stack as any[])
      .map((layer) => layer.route)
      .filter((route) => route?.methods?.[method])
      .map((route) => route.path);
  }

  test('keeps custom chat, messages, and responses paths', () => {
    const postPaths = getRoutePaths('post');

    expect(postPaths).toContain(
      '/:workspaceId/:gatewayId/custom/v1/chat/completions'
    );
    expect(postPaths).toContain('/:workspaceId/:gatewayId/custom/v1/messages');
    expect(postPaths).toContain('/:workspaceId/:gatewayId/custom/v1/responses');
  });
});
