import { AIRouterLogsStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import {
  AI_ROUTER_PROTOCOLS,
  applyAIRouterModelOverride,
  buildBufferedAIGatewayAttemptResult,
  createAIRouterAttemptRequest,
  getAIRouterProtocolForPath,
  isAIGatewayEligibleForAIRouter,
  isAIRouterNodeEligibleForProtocol,
  isAIRouterRetryableFailure,
  resolveAIRouterGatewayHandlerConfig,
  runAIRouterAttempts,
  selectAIRouterTierAttemptNodes,
  selectEligibleAIRouterNodes,
} from './aiRouter.js';
import { aiRouterRouter } from '../router/aiRouter.js';

describe('AI Router protocol helpers', () => {
  test('exports stable protocol identifiers', () => {
    expect(AI_ROUTER_PROTOCOLS).toEqual({
      OPENAI_CHAT: 'openai-chat',
      OPENAI_RESPONSES: 'openai-responses',
      ANTHROPIC_MESSAGES: 'anthropic-messages',
    });
  });

  test('maps supported runtime paths to protocols', () => {
    expect(getAIRouterProtocolForPath('openai', 'chat/completions')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT
    );
    expect(getAIRouterProtocolForPath('deepseek', 'chat/completions')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT
    );
    expect(getAIRouterProtocolForPath('anthropic', 'chat/completions')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT
    );
    expect(getAIRouterProtocolForPath('openrouter', 'chat/completions')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT
    );
    expect(getAIRouterProtocolForPath('openai', 'responses')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES
    );
    expect(getAIRouterProtocolForPath('anthropic', 'messages')).toBe(
      AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES
    );
    expect(getAIRouterProtocolForPath('openrouter', 'messages')).toBe(
      AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES
    );
  });

  test('maps custom runtime paths to all supported protocols', () => {
    expect(getAIRouterProtocolForPath('custom', 'chat/completions')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT
    );
    expect(getAIRouterProtocolForPath('custom', 'responses')).toBe(
      AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES
    );
    expect(getAIRouterProtocolForPath('custom', 'messages')).toBe(
      AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES
    );
  });

  test('returns null for unsupported endpoint combinations', () => {
    expect(getAIRouterProtocolForPath('deepseek', 'responses')).toBeNull();
    expect(getAIRouterProtocolForPath('openai', 'messages')).toBeNull();
    expect(getAIRouterProtocolForPath('deepseek', 'messages')).toBeNull();
    expect(getAIRouterProtocolForPath('anthropic', 'responses')).toBeNull();
  });
});

describe('AI Router model override helpers', () => {
  test('applies model override without mutating original payload', () => {
    const messages = [{ role: 'user', content: 'hello' }];
    const payload = { model: 'gpt-4o-mini', messages };

    const next = applyAIRouterModelOverride(payload, 'deepseek-chat');

    expect(next).toEqual({
      model: 'deepseek-chat',
      messages,
    });
    expect(next).not.toBe(payload);
    expect(next.messages).toBe(messages);
    expect(payload).toEqual({
      model: 'gpt-4o-mini',
      messages,
    });
  });

  test('returns a shallow copy when model override is empty or null', () => {
    const payload = { model: 'gpt-4o-mini', input: 'hello' };

    const emptyOverride = applyAIRouterModelOverride(payload, '');
    const nullOverride = applyAIRouterModelOverride(payload, null);

    expect(emptyOverride).toEqual(payload);
    expect(emptyOverride).not.toBe(payload);
    expect(nullOverride).toEqual(payload);
    expect(nullOverride).not.toBe(payload);
  });
});

describe('AI Router eligibility helpers', () => {
  test('selects enabled nodes by node provider without gateway router metadata', () => {
    const nodes = selectEligibleAIRouterNodes(
      [
        {
          id: 'openai-route',
          enabled: true,
          order: 2,
          provider: 'openai',
          gateway: {
            id: 'gw-openai',
            modelApiKey: 'sk-openai',
          },
        },
        {
          id: 'openrouter-route',
          enabled: true,
          order: 3,
          provider: 'openrouter',
          gateway: {
            id: 'gw-openrouter',
            modelApiKey: 'sk-openrouter',
          },
        },
        {
          id: 'messages-only-route',
          enabled: true,
          order: 1,
          provider: 'anthropic',
          gateway: {
            id: 'gw-anthropic',
            modelApiKey: 'sk-anthropic',
          },
        },
        {
          id: 'custom-route',
          enabled: true,
          order: 0,
          provider: 'custom',
          gateway: {
            id: 'gw-custom',
            modelApiKey: 'sk-custom',
          },
        },
      ],
      AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES
    );

    expect(nodes.map((node) => node.id)).toEqual([
      'custom-route',
      'openai-route',
    ]);
  });

  test('selects enabled nodes by gateway protocol capability without node protocol lanes', () => {
    const nodes = selectEligibleAIRouterNodes(
      [
        {
          id: 'second',
          enabled: true,
          order: 20,
          gateway: {
            id: 'gw-second',
            modelApiKey: 'sk-second',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'anthropic-only',
          enabled: true,
          order: 5,
          gateway: {
            id: 'gw-anthropic-only',
            modelApiKey: 'sk-anthropic',
            modelProvider: 'anthropic',
            modelProtocols: ['anthropic-messages'],
          },
        },
        {
          id: 'first',
          enabled: true,
          order: 10,
          gateway: {
            id: 'gw-first',
            modelApiKey: 'sk-first',
            modelProvider: 'custom',
            modelProtocols: ['openai-chat', 'anthropic-messages'],
          },
        },
      ],
      'openai-chat'
    );

    expect(nodes.map((node) => node.id)).toEqual(['first', 'second']);
  });

  test('keeps only enabled nodes whose gateway can serve the protocol sorted by order', () => {
    const nodes = selectEligibleAIRouterNodes(
      [
        {
          id: 'second',
          enabled: true,
          protocol: 'openai-chat',
          order: 20,
          gateway: {
            id: 'gw-second',
            modelApiKey: 'sk-second',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'disabled',
          enabled: false,
          protocol: 'openai-chat',
          order: 1,
          gateway: {
            id: 'gw-disabled',
            modelApiKey: 'sk-disabled',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'missing-gateway',
          enabled: true,
          protocol: 'openai-chat',
          order: 2,
          gateway: null,
        },
        {
          id: 'missing-api-key',
          enabled: true,
          protocol: 'openai-chat',
          order: 3,
          gateway: {
            id: 'gw-no-key',
            modelApiKey: null,
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'missing-provider',
          enabled: true,
          protocol: 'openai-chat',
          order: 4,
          gateway: {
            id: 'gw-no-provider',
            modelApiKey: 'sk-no-provider',
            modelProvider: null,
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'node-protocol-mismatch',
          enabled: true,
          protocol: 'anthropic-messages',
          order: 5,
          gateway: {
            id: 'gw-node-mismatch',
            modelApiKey: 'sk-node-mismatch',
            modelProvider: 'anthropic',
            modelProtocols: ['anthropic-messages'],
          },
        },
        {
          id: 'gateway-protocol-mismatch',
          enabled: true,
          protocol: 'openai-chat',
          order: 6,
          gateway: {
            id: 'gw-protocol-mismatch',
            modelApiKey: 'sk-protocol-mismatch',
            modelProvider: 'openai',
            modelProtocols: ['anthropic-messages'],
          },
        },
        {
          id: 'blank-api-key',
          enabled: true,
          protocol: 'openai-chat',
          order: 7,
          gateway: {
            id: 'gw-blank-key',
            modelApiKey: '   ',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'blank-provider',
          enabled: true,
          protocol: 'openai-chat',
          order: 8,
          gateway: {
            id: 'gw-blank-provider',
            modelApiKey: 'sk-blank-provider',
            modelProvider: '   ',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'first',
          enabled: true,
          protocol: 'openai-chat',
          order: 10,
          gateway: {
            id: 'gw-first',
            modelApiKey: 'sk-first',
            modelProvider: 'custom',
            modelProtocols: ['openai-chat', 'anthropic-messages'],
          },
        },
      ],
      'openai-chat'
    );

    expect(nodes.map((node) => node.id)).toEqual(['first', 'second']);
  });

  test('orders eligible tier nodes by weighted random without replacement', () => {
    const nodes = selectAIRouterTierAttemptNodes(
      [
        {
          id: 'small',
          enabled: true,
          order: 0,
          weight: 1,
          gateway: {
            id: 'gw-small',
            modelApiKey: 'sk-small',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'large',
          enabled: true,
          order: 1,
          weight: 9,
          gateway: {
            id: 'gw-large',
            modelApiKey: 'sk-large',
            modelProvider: 'openai',
            modelProtocols: ['openai-chat'],
          },
        },
        {
          id: 'incompatible',
          enabled: true,
          order: 2,
          weight: 100,
          gateway: {
            id: 'gw-incompatible',
            modelApiKey: 'sk-incompatible',
            modelProvider: 'anthropic',
            modelProtocols: ['anthropic-messages'],
          },
        },
      ],
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      () => 0.5
    );

    expect(nodes.map((node) => node.id)).toEqual(['large', 'small']);
  });
});

describe('AI Router gateway eligibility helpers', () => {
  test('accepts a gateway with credentials', () => {
    expect(
      isAIGatewayEligibleForAIRouter({
        modelApiKey: 'sk-test',
      })
    ).toBe(true);
  });

  test.each([null, '', '   '])(
    'rejects gateway when modelApiKey is %s',
    (modelApiKey) => {
      expect(
        isAIGatewayEligibleForAIRouter({
          modelApiKey,
        })
      ).toBe(false);
    }
  );
});

describe('AI Router node provider eligibility helpers', () => {
  test.each([null, '', '   '])(
    'rejects node when provider is %s',
    (provider) => {
      expect(
        isAIRouterNodeEligibleForProtocol(
          {
            enabled: true,
            order: 0,
            provider,
            gateway: {
              modelApiKey: 'sk-test',
            },
          },
          AI_ROUTER_PROTOCOLS.OPENAI_CHAT
        )
      ).toBe(false);
    }
  );

  test('checks node provider compatibility separately from gateway credentials', () => {
    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          provider: 'openai',
          gateway: {
            modelApiKey: 'sk-test',
          },
        },
        AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES
      )
    ).toBe(true);

    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          provider: 'openrouter',
          gateway: {
            modelApiKey: 'sk-test',
          },
        },
        AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES
      )
    ).toBe(false);

    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          provider: 'openai',
          gateway: {
            modelApiKey: 'sk-test',
          },
        },
        'unknown-protocol'
      )
    ).toBe(false);
  });

  test('rejects disabled nodes and nodes without gateway credentials', () => {
    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: false,
          order: 0,
          provider: 'openai',
          gateway: {
            modelApiKey: 'sk-test',
          },
        },
        AI_ROUTER_PROTOCOLS.OPENAI_CHAT
      )
    ).toBe(false);

    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          provider: 'openai',
          gateway: {
            modelApiKey: null,
          },
        },
        AI_ROUTER_PROTOCOLS.OPENAI_CHAT
      )
    ).toBe(false);

    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          provider: 'openai',
          gateway: null,
        },
        AI_ROUTER_PROTOCOLS.OPENAI_CHAT
      )
    ).toBe(false);
  });
});

describe('AI Router legacy gateway metadata compatibility', () => {
  test('can read provider and protocol from older gateway-backed nodes', () => {
    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          gateway: {
            modelApiKey: 'sk-test',
            modelProvider: 'openai',
            modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
          },
        } as any,
        AI_ROUTER_PROTOCOLS.OPENAI_CHAT
      )
    ).toBe(true);

    expect(
      isAIRouterNodeEligibleForProtocol(
        {
          enabled: true,
          order: 0,
          gateway: {
            modelApiKey: 'sk-test',
            modelProvider: 'openai',
            modelProtocols: [AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES],
          },
        } as any,
        AI_ROUTER_PROTOCOLS.OPENAI_CHAT
      )
    ).toBe(false);
  });
});

describe('AI Router retry helpers', () => {
  test('treats default transient failures as retryable', () => {
    expect(isAIRouterRetryableFailure({ statusCode: 429 })).toBe(true);
    expect(isAIRouterRetryableFailure({ statusCode: 500 })).toBe(true);
    expect(isAIRouterRetryableFailure({ statusCode: 502 })).toBe(true);
    expect(isAIRouterRetryableFailure({ statusCode: 503 })).toBe(true);
    expect(isAIRouterRetryableFailure({ statusCode: 504 })).toBe(true);
    expect(isAIRouterRetryableFailure({ errorType: 'network' })).toBe(true);
    expect(isAIRouterRetryableFailure({ errorType: 'timeout' })).toBe(true);
  });

  test('does not retry default client and auth failures', () => {
    expect(isAIRouterRetryableFailure({ statusCode: 400 })).toBe(false);
    expect(isAIRouterRetryableFailure({ statusCode: 401 })).toBe(false);
    expect(isAIRouterRetryableFailure({ statusCode: 403 })).toBe(false);
    expect(isAIRouterRetryableFailure({ statusCode: 404 })).toBe(false);
    expect(isAIRouterRetryableFailure({ statusCode: 422 })).toBe(false);
  });

  test('adds node-specific retryable status codes without removing defaults', () => {
    expect(
      isAIRouterRetryableFailure({
        statusCode: 418,
        retryableStatusCodes: [418],
      })
    ).toBe(true);
    expect(
      isAIRouterRetryableFailure({
        statusCode: 503,
        retryableStatusCodes: [418],
      })
    ).toBe(true);
  });
});

describe('AI Router buffered attempt mapping', () => {
  test('preserves non-retryable 4xx statuses as uncommitted failures', () => {
    const result = buildBufferedAIGatewayAttemptResult({
      gatewayId: 'gw1',
      logId: 'log1',
      response: {
        statusCode: 401,
        headers: {
          'content-type': 'application/json',
        },
        chunks: [Buffer.from('{"error":{"message":"unauthorized"}}')],
        jsonBody: {
          error: {
            message: 'unauthorized',
          },
        },
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: true,
      },
    });

    expect(result).toMatchObject({
      ok: false,
      committed: false,
      gatewayId: 'gw1',
      logId: 'log1',
      statusCode: 401,
      failure: {
        message: 'unauthorized',
        errorType: 'upstream',
      },
    });
    expect(isAIRouterRetryableFailure({ statusCode: result.statusCode })).toBe(
      false
    );
  });

  test('marks buffered partial output failures as committed', () => {
    const result = buildBufferedAIGatewayAttemptResult({
      gatewayId: 'gw1',
      logId: 'log1',
      response: {
        statusCode: 500,
        headers: {
          'content-type': 'text/event-stream',
        },
        chunks: [Buffer.from('data: {"delta":"hello"}\n\n')],
        wroteBody: true,
        bodyStartedBeforeFailure: true,
        ended: true,
      },
    });

    expect(result).toMatchObject({
      ok: false,
      committed: true,
      gatewayId: 'gw1',
      logId: 'log1',
      statusCode: 500,
      failure: {
        errorType: 'upstream',
      },
    });
  });

  test('marks unfinished buffered output as committed failure', () => {
    const result = buildBufferedAIGatewayAttemptResult({
      gatewayId: 'gw1',
      response: {
        statusCode: 200,
        headers: {
          'content-type': 'text/event-stream',
        },
        chunks: [Buffer.from('data: {"delta":"hello"}\n\n')],
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: false,
      },
    });

    expect(result).toMatchObject({
      ok: false,
      committed: true,
      gatewayId: 'gw1',
      statusCode: 500,
      failure: {
        message: 'AI Gateway attempt ended after partial output',
        errorType: 'upstream',
      },
    });
  });
});

describe('AI Router gateway provider dispatch', () => {
  test('resolves OpenAI-compatible chat handlers from node gateway provider', () => {
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
        modelProvider: 'openai',
      })
    ).toMatchObject({
      builder: 'openai-chat',
      options: {
        modelProvider: 'openai',
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
        modelProvider: 'deepseek',
      })
    ).toMatchObject({
      builder: 'openai-chat',
      options: {
        baseUrl: 'https://api.deepseek.com',
        modelProvider: 'deepseek',
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
        modelProvider: 'anthropic',
      })
    ).toMatchObject({
      builder: 'openai-chat',
      options: {
        baseUrl: 'https://api.anthropic.com/v1/',
        modelProvider: 'anthropic',
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
        modelProvider: 'custom',
      })
    ).toMatchObject({
      builder: 'openai-chat',
      options: {
        isCustomRoute: true,
      },
    });
  });

  test('resolves OpenRouter headers for chat and messages attempts', () => {
    const chatConfig = resolveAIRouterGatewayHandlerConfig({
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      modelProvider: 'openrouter',
    });
    const messagesConfig = resolveAIRouterGatewayHandlerConfig({
      protocol: AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
      modelProvider: 'openrouter',
    });
    const req = {
      headers: {},
    } as any;
    const lowercaseHeaderReq = {
      headers: {
        'http-referer': 'https://example.com/app',
        'x-title': 'Example App',
      },
    } as any;

    expect(chatConfig).toMatchObject({
      builder: 'openai-chat',
      options: {
        baseUrl: 'https://openrouter.ai/api/v1',
        modelProvider: 'openrouter',
      },
    });
    expect(chatConfig?.options.header?.(req)).toEqual({
      'HTTP-Referer': 'https://tianji.dev/',
      'X-Title': 'Tianji',
    });
    expect(chatConfig?.options.header?.(lowercaseHeaderReq)).toEqual({
      'HTTP-Referer': 'https://example.com/app',
      'X-Title': 'Example App',
    });
    expect(messagesConfig).toMatchObject({
      builder: 'anthropic-messages',
      options: {
        baseUrl: 'https://openrouter.ai/api/v1',
        modelProvider: 'openrouter',
      },
    });
    expect(messagesConfig?.options.header?.(req)).toEqual({
      'HTTP-Referer': 'https://tianji.dev/',
      'X-Title': 'Tianji',
    });
    expect(messagesConfig?.options.header?.(lowercaseHeaderReq)).toEqual({
      'HTTP-Referer': 'https://example.com/app',
      'X-Title': 'Example App',
    });
  });

  test('resolves only providers compatible with the protocol lane', () => {
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES,
        modelProvider: 'openai',
      })
    ).toMatchObject({
      builder: 'openai-responses',
      options: {
        modelProvider: 'openai',
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES,
        modelProvider: 'custom',
      })
    ).toMatchObject({
      builder: 'openai-responses',
      options: {
        isCustomRoute: true,
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
        modelProvider: 'anthropic',
      })
    ).toMatchObject({
      builder: 'anthropic-messages',
      options: {
        baseUrl: 'https://api.anthropic.com/v1',
        modelProvider: 'anthropic',
      },
    });
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES,
        modelProvider: 'deepseek',
      })
    ).toBeNull();
    expect(
      resolveAIRouterGatewayHandlerConfig({
        protocol: AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
        modelProvider: 'openai',
      })
    ).toBeNull();
  });
});

describe('AI Router attempt request isolation', () => {
  test('creates per-attempt request metadata without mutating the shared request', async () => {
    const sharedReq = {
      params: {
        workspaceId: 'workspace1',
        routerId: 'router1',
      },
      body: {
        model: 'shared-model',
      },
      headers: {},
      __onAIGatewayLogCreated: () => {
        throw new Error('shared callback should not receive attempt logs');
      },
      __aiGatewayLogPromise: Promise.resolve({ id: 'shared-log' } as any),
    } as any;
    const node = {
      id: 'node1',
      gatewayId: 'gw1',
      enabled: true,
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      order: 1,
      modelOverride: null,
      timeoutMs: 1,
      retryableStatusCodes: [],
      gateway: {
        id: 'gw1',
        modelApiKey: 'sk-test',
        modelProvider: 'openai',
        modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
      },
    };

    const first = createAIRouterAttemptRequest({
      req: sharedReq,
      node,
      payload: {
        model: 'first-model',
      },
    });
    const second = createAIRouterAttemptRequest({
      req: sharedReq,
      node: {
        ...node,
        id: 'node2',
        gatewayId: 'gw2',
      },
      payload: {
        model: 'second-model',
      },
    });

    first.attemptReq.__onAIGatewayLogCreated?.({ id: 'late-log1' } as any);
    second.attemptReq.__onAIGatewayLogCreated?.({ id: 'late-log2' } as any);

    expect(first.attemptReq).not.toBe(sharedReq);
    expect(second.attemptReq).not.toBe(sharedReq);
    expect(second.attemptReq).not.toBe(first.attemptReq);
    expect(first.attemptReq.params.gatewayId).toBe('gw1');
    expect(second.attemptReq.params.gatewayId).toBe('gw2');
    expect(first.attemptReq.body.model).toBe('first-model');
    expect(second.attemptReq.body.model).toBe('second-model');
    expect(sharedReq.params).toEqual({
      workspaceId: 'workspace1',
      routerId: 'router1',
    });
    expect(sharedReq.body).toEqual({
      model: 'shared-model',
    });
    await expect(first.getGatewayLogId()).resolves.toBe('late-log1');
    await expect(second.getGatewayLogId()).resolves.toBe('late-log2');
    await expect(sharedReq.__aiGatewayLogPromise).resolves.toEqual({
      id: 'shared-log',
    });
  });
});

describe('aiRouterRouter routes', () => {
  function getPostRoutePaths() {
    return (aiRouterRouter.stack as any[])
      .map((layer) => layer.route)
      .filter((route) => route?.methods?.post)
      .map((route) => route.path);
  }

  test('registers mirrored runtime paths', () => {
    const paths = getPostRoutePaths();

    expect(paths).toContain(
      '/:workspaceId/:routerId/openai/v1/chat/completions'
    );
    expect(paths).toContain('/:workspaceId/:routerId/openai/v1/responses');
    expect(paths).toContain(
      '/:workspaceId/:routerId/deepseek/v1/chat/completions'
    );
    expect(paths).toContain(
      '/:workspaceId/:routerId/anthropic/v1/chat/completions'
    );
    expect(paths).toContain('/:workspaceId/:routerId/anthropic/v1/messages');
    expect(paths).toContain(
      '/:workspaceId/:routerId/openrouter/v1/chat/completions'
    );
    expect(paths).toContain('/:workspaceId/:routerId/openrouter/v1/messages');
    expect(paths).toContain(
      '/:workspaceId/:routerId/custom/v1/chat/completions'
    );
    expect(paths).toContain('/:workspaceId/:routerId/custom/v1/messages');
    expect(paths).toContain('/:workspaceId/:routerId/custom/v1/responses');
  });
});

describe('AI Router orchestration', () => {
  test('stops failover and writes Partial when an attempt has committed output', async () => {
    const attemptedGatewayIds: string[] = [];
    const createdLogs: any[] = [];

    const result = await runAIRouterAttempts({
      workspaceId: 'workspace1',
      routerId: 'router1',
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      requestPayload: {
        model: 'original-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      loadRouter: async () => ({
        id: 'router1',
        nodes: [
          {
            id: 'node1',
            gatewayId: 'gw1',
            enabled: true,
            protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
            order: 1,
            modelOverride: null,
            timeoutMs: 30000,
            retryableStatusCodes: [],
            gateway: {
              id: 'gw1',
              modelApiKey: 'sk-first',
              modelProvider: 'openai',
              modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
            },
          },
          {
            id: 'node2',
            gatewayId: 'gw2',
            enabled: true,
            protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
            order: 2,
            modelOverride: null,
            timeoutMs: 30000,
            retryableStatusCodes: [],
            gateway: {
              id: 'gw2',
              modelApiKey: 'sk-second',
              modelProvider: 'openai',
              modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
            },
          },
        ],
      }),
      executeAttempt: async ({ node }) => {
        attemptedGatewayIds.push(node.gatewayId);

        return {
          ok: false,
          committed: true,
          gatewayId: node.gatewayId,
          statusCode: 500,
          logId: 'log1',
          failure: {
            message: 'stream failed after chunks',
            errorType: 'upstream',
          },
        };
      },
      createLog: async (data) => {
        createdLogs.push(data);
        return {
          id: 'router-log1',
          ...data,
        };
      },
      now: () => 1000,
      random: () => 0,
    });

    expect(attemptedGatewayIds).toEqual(['gw1']);
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0]).toMatchObject({
      status: AIRouterLogsStatus.Partial,
      finalGatewayId: 'gw1',
      finalGatewayLogId: 'log1',
      attemptGatewayIds: ['gw1'],
      attemptGatewayLogIds: ['log1'],
      attemptCount: 1,
    });
    expect(result.result).toMatchObject({
      ok: false,
      committed: true,
      gatewayId: 'gw1',
    });
  });

  test('writes a failed router log without executing when no nodes are eligible', async () => {
    const createdLogs: any[] = [];

    const result = await runAIRouterAttempts({
      workspaceId: 'workspace1',
      routerId: 'router1',
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      requestPayload: {
        model: 'original-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      loadRouter: async () => ({
        id: 'router1',
        nodes: [
          {
            id: 'node1',
            gatewayId: 'gw1',
            enabled: false,
            protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
            order: 1,
            modelOverride: null,
            timeoutMs: 30000,
            retryableStatusCodes: [],
            gateway: {
              id: 'gw1',
              modelApiKey: 'sk-first',
              modelProvider: 'openai',
              modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
            },
          },
        ],
      }),
      executeAttempt: async () => {
        throw new Error('executor should not run');
      },
      createLog: async (data) => {
        createdLogs.push(data);
        return {
          id: 'router-log1',
          ...data,
        };
      },
      now: () => 1000,
    });

    expect(result.result).toBeNull();
    expect(result.attempts).toEqual([]);
    expect(createdLogs).toEqual([
      {
        workspaceId: 'workspace1',
        routerId: 'router1',
        protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
        status: AIRouterLogsStatus.Failed,
        finalGatewayId: undefined,
        finalGatewayLogId: undefined,
        attemptGatewayIds: [],
        attemptGatewayLogIds: [],
        attemptErrors: [],
        attemptCount: 0,
        duration: 0,
      },
    ]);
  });

  test('fails over after retryable failures and writes one success router log', async () => {
    const attemptedGatewayIds: string[] = [];
    const payloadModels: unknown[] = [];
    const createdLogs: any[] = [];

    const result = await runAIRouterAttempts({
      workspaceId: 'workspace1',
      routerId: 'router1',
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      requestPayload: {
        model: 'original-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      loadRouter: async () => ({
        id: 'router1',
        nodes: [
          {
            id: 'node1',
            gatewayId: 'gw1',
            enabled: true,
            protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
            order: 1,
            modelOverride: 'first-model',
            timeoutMs: 30000,
            retryableStatusCodes: [],
            gateway: {
              id: 'gw1',
              modelApiKey: 'sk-first',
              modelProvider: 'openai',
              modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
            },
          },
          {
            id: 'node2',
            gatewayId: 'gw2',
            enabled: true,
            protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
            order: 2,
            modelOverride: 'second-model',
            timeoutMs: 30000,
            retryableStatusCodes: [],
            gateway: {
              id: 'gw2',
              modelApiKey: 'sk-second',
              modelProvider: 'openai',
              modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
            },
          },
        ],
      }),
      executeAttempt: async ({ node, payload }) => {
        attemptedGatewayIds.push(node.gatewayId);
        payloadModels.push(payload.model);

        if (node.gatewayId === 'gw1') {
          return {
            ok: false,
            committed: false,
            gatewayId: 'gw1',
            statusCode: 429,
            logId: 'log1',
            failure: {
              message: 'rate limited',
              errorType: 'upstream',
            },
          };
        }

        return {
          ok: true,
          committed: true,
          gatewayId: 'gw2',
          statusCode: 200,
          logId: 'log2',
        };
      },
      createLog: async (data) => {
        createdLogs.push(data);
        return {
          id: 'router-log1',
          ...data,
        };
      },
      now: (() => {
        let current = 1000;
        return () => {
          current += 25;
          return current;
        };
      })(),
      random: () => 0,
    });

    expect(attemptedGatewayIds).toEqual(['gw1', 'gw2']);
    expect(payloadModels).toEqual(['first-model', 'second-model']);
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0]).toMatchObject({
      workspaceId: 'workspace1',
      routerId: 'router1',
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      status: AIRouterLogsStatus.Success,
      finalGatewayId: 'gw2',
      finalGatewayLogId: 'log2',
      attemptGatewayIds: ['gw1', 'gw2'],
      attemptGatewayLogIds: ['log1', 'log2'],
      attemptCount: 2,
    });
    expect(createdLogs[0].attemptErrors).toEqual([
      {
        gatewayId: 'gw1',
        gatewayLogId: 'log1',
        statusCode: 429,
        retryable: true,
        errorType: 'upstream',
        message: 'rate limited',
      },
      {
        gatewayId: 'gw2',
        gatewayLogId: 'log2',
        statusCode: 200,
        retryable: false,
      },
    ]);
    expect(result.log).toMatchObject({
      status: AIRouterLogsStatus.Success,
      attemptCount: 2,
    });
    expect(result.result).toMatchObject({
      ok: true,
      gatewayId: 'gw2',
      logId: 'log2',
    });
  });

  test('uses weighted tier ordering before falling through to the next tier', async () => {
    const attemptedGatewayIds: string[] = [];

    const result = await runAIRouterAttempts({
      workspaceId: 'workspace1',
      routerId: 'router1',
      protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      requestPayload: {
        model: 'original-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      loadRouter: async () => ({
        id: 'router1',
        tiers: [
          {
            id: 'tier1',
            order: 0,
            nodes: [
              {
                id: 'node-small',
                gatewayId: 'gw-small',
                enabled: true,
                order: 0,
                weight: 1,
                modelOverride: null,
                timeoutMs: 30000,
                retryableStatusCodes: [],
                gateway: {
                  id: 'gw-small',
                  modelApiKey: 'sk-small',
                  modelProvider: 'openai',
                  modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
                },
              },
              {
                id: 'node-large',
                gatewayId: 'gw-large',
                enabled: true,
                order: 1,
                weight: 9,
                modelOverride: null,
                timeoutMs: 30000,
                retryableStatusCodes: [],
                gateway: {
                  id: 'gw-large',
                  modelApiKey: 'sk-large',
                  modelProvider: 'openai',
                  modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
                },
              },
            ],
          },
          {
            id: 'tier2',
            order: 1,
            nodes: [
              {
                id: 'node-backup',
                gatewayId: 'gw-backup',
                enabled: true,
                order: 0,
                weight: 100,
                modelOverride: null,
                timeoutMs: 30000,
                retryableStatusCodes: [],
                gateway: {
                  id: 'gw-backup',
                  modelApiKey: 'sk-backup',
                  modelProvider: 'openai',
                  modelProtocols: [AI_ROUTER_PROTOCOLS.OPENAI_CHAT],
                },
              },
            ],
          },
        ],
      }),
      executeAttempt: async ({ node }) => {
        attemptedGatewayIds.push(node.gatewayId);

        if (node.gatewayId === 'gw-backup') {
          return {
            ok: true,
            committed: true,
            gatewayId: node.gatewayId,
            statusCode: 200,
            logId: 'log-backup',
          };
        }

        return {
          ok: false,
          committed: false,
          gatewayId: node.gatewayId,
          statusCode: 429,
          logId: `log-${node.gatewayId}`,
          failure: {
            message: 'rate limited',
            errorType: 'upstream',
          },
        };
      },
      createLog: async (data) => ({
        id: 'router-log1',
        ...data,
      }),
      now: () => 1000,
      random: () => 0.5,
    });

    expect(attemptedGatewayIds).toEqual([
      'gw-large',
      'gw-small',
      'gw-backup',
    ]);
    expect(result.result).toMatchObject({
      ok: true,
      gatewayId: 'gw-backup',
      logId: 'log-backup',
    });
  });
});
