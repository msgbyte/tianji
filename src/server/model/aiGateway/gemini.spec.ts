import 'express-async-errors';
import express from 'express';
import { request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import request from 'supertest';
import { GoogleGenAI } from '@google/genai';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { aiGatewayRouter } from '../../router/aiGateway.js';
import { prisma } from '../_client.js';
import { checkQuotaAlert } from './quotaAlert.js';

vi.mock('../_client.js', () => ({
  prisma: {
    aIGateway: { findUnique: vi.fn() },
    aIGatewayLogs: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('./quotaAlert.js', () => ({ checkQuotaAlert: vi.fn() }));
vi.mock('../../cache/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buildQueryWithCache: (_name: string, get: unknown) => ({ get, del: vi.fn() }),
}));

const prefix = '/api/ai/workspace/gateway/custom';
const contents = [{ role: 'user', parts: [{ text: 'Hola' }] }];
const usageMetadata = {
  promptTokenCount: 100,
  candidatesTokenCount: 5,
  thoughtsTokenCount: 15,
  cachedContentTokenCount: 40,
  totalTokenCount: 120,
};
const response = {
  candidates: [
    {
      index: 0,
      content: { role: 'model', parts: [{ text: 'Hola' }] },
      finishReason: 'STOP',
    },
  ],
  usageMetadata,
};
let servers: Server[] = [];
let received: { url: string; body: any; headers: any }[] = [];
let relayHandler: express.RequestHandler;
let relayUrl: string;
let gateway: any;
const app = express();
app.use(express.json());
app.use('/api/ai', aiGatewayRouter);
app.use((_req, res) => {
  res.status(404).json({ error: { code: 404 } });
});
app.use(((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: { code: err.status || 500 } });
}) as express.ErrorRequestHandler);

async function listen(application: express.Express) {
  const server = application.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

function post(
  action = 'generateContent',
  body: any = { contents },
  model = 'relay/gemini',
  version = 'v1beta'
) {
  return request(app)
    .post(
      `${prefix}/${version}/models/${model}:${action}${action === 'streamGenerateContent' ? '?alt=sse' : ''}`
    )
    .set('x-goog-api-key', 'test-upstream-key')
    .send(body);
}

beforeEach(async () => {
  vi.resetAllMocks();
  received = [];
  relayHandler = (_req, res) => {
    res.json(response);
  };
  const relay = express();
  relay.use(express.json());
  relay.use((req, res, next) => {
    received.push({ url: req.url, body: req.body, headers: req.headers });
    relayHandler(req, res, next);
  });
  relayUrl = await listen(relay);
  gateway = {
    id: 'gateway',
    workspaceId: 'workspace',
    customModelBaseUrl: `${relayUrl}/gemini`,
    customModelStrategy: { price: { input: 2, output: 6, cacheRead: 0.5 } },
  };
  vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue(gateway);
  vi.mocked(prisma.aIGatewayLogs.create).mockResolvedValue({
    id: 'log',
  } as any);
  vi.mocked(prisma.aIGatewayLogs.update).mockResolvedValue({} as any);
  vi.mocked(checkQuotaAlert).mockResolvedValue(undefined);
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
          server.closeAllConnections();
        })
    )
  );
  servers = [];
});

describe('Gemini native relay with the official SDK', () => {
  test.each(['', '/'])(
    'preserves OpenAI model discovery at /v1/models%s',
    async (suffix) => {
      gateway.customModelBaseUrl = `${relayUrl}/v1`;
      const models = {
        object: 'list',
        data: [
          { id: 'relay-model', object: 'model', created: 0, owned_by: 'relay' },
        ],
      };
      relayHandler = (_req, res) => {
        res.json(models);
      };

      const result = await request(app)
        .get(`${prefix}/v1/models${suffix}`)
        .set('Authorization', 'Bearer test-upstream-key');

      expect(result.status).toBe(200);
      expect(result.body).toEqual(models);
      expect(received).toHaveLength(1);
      expect(received[0].url).toBe('/v1/models');
    }
  );

  test.each([
    { promptTokenCount: 2147483648 },
    { candidatesTokenCount: 2147483647, thoughtsTokenCount: 1 },
    { cachedContentTokenCount: -1 },
    { thoughtsTokenCount: 1.5 },
    { promptTokenCount: '100' },
  ])('rejects usage that cannot be safely logged: %j', async (invalidUsage) => {
    relayHandler = (_req, res) => {
      res.json({ ...response, usageMetadata: invalidUsage });
    };
    expect((await post()).status).toBe(502);
    await vi.waitFor(() =>
      expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Failed',
            inputToken: 0,
            outputToken: 0,
            responsePayload: expect.objectContaining({
              gateway: expect.objectContaining({ priceKnown: false }),
            }),
          }),
        })
      )
    );
    expect(checkQuotaAlert).not.toHaveBeenCalled();
  });
  test.each([false, true])(
    'preserves citations through a downstream SDK, stream=%s',
    async (stream) => {
      const citationSources = [
        {
          startIndex: 0,
          endIndex: 4,
          uri: 'https://example.com/source',
          license: 'CC-BY',
        },
      ];
      const native = {
        ...response,
        candidates: [
          { ...response.candidates[0], citationMetadata: { citationSources } },
        ],
      };
      relayHandler = (_req, res) => {
        if (stream)
          res
            .type('text/event-stream')
            .end(`data: ${JSON.stringify(native)}\n\n`);
        else res.json(native);
      };
      const wire = await post(
        stream ? 'streamGenerateContent' : 'generateContent'
      );
      const data = stream ? JSON.parse(wire.text.slice(6)) : wire.body;
      expect(data.candidates[0].citationMetadata).toEqual({ citationSources });
      const baseUrl = await listen(app);
      const ai = new GoogleGenAI({
        apiKey: 'test-upstream-key',
        httpOptions: { baseUrl: `${baseUrl}${prefix}` },
      });
      const params = { model: 'gemini', contents };
      if (stream) {
        for await (const chunk of await ai.models.generateContentStream(params))
          expect(chunk.candidates?.[0].citationMetadata?.citations).toEqual(
            citationSources
          );
      } else {
        expect(
          (await ai.models.generateContent(params)).candidates?.[0]
            .citationMetadata?.citations
        ).toEqual(citationSources);
      }
    }
  );
  test('enforces a total deadline even while native stream chunks keep arriving', async () => {
    let upstream: express.Response;
    relayHandler = (_req, res) => {
      upstream = res;
      res.type('text/event-stream');
    };
    const baseUrl = await listen(app);
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });
    const ai = new GoogleGenAI({
      apiKey: 'test-upstream-key',
      httpOptions: {
        baseUrl: `${baseUrl}${prefix}`,
        retryOptions: { attempts: 1 },
      },
    });
    let seen = 0;
    const done = (async () => {
      for await (const _chunk of await ai.models.generateContentStream({
        model: 'gemini',
        contents,
      }))
        seen++;
    })().then(
      () => null,
      (error) => error
    );
    await vi.waitFor(() => expect(received).toHaveLength(1));
    for (let i = 1; i <= 10; i++) {
      upstream!.write(
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Partial' }] } }] })}\n\n`
      );
      await vi.waitFor(() => expect(seen).toBe(i));
      if (i < 10) await vi.advanceTimersByTimeAsync(60_000);
    }
    await vi.advanceTimersByTimeAsync(60_001);
    expect(await done).toBeInstanceOf(Error);
    vi.useRealTimers();
    await vi.waitFor(() =>
      expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Failed',
            responsePayload: expect.objectContaining({
              error: expect.objectContaining({ code: 504 }),
            }),
          }),
        })
      )
    );
  });
  test.each(['broken-json', 'incomplete', 'error-event', 'invalid-usage'])(
    'reports %s streams as failures to an official SDK client',
    async (mode) => {
      relayHandler = (_req, res) => {
        res.type('text/event-stream');
        res.write(
          `data: ${JSON.stringify({ candidates: [{ index: 0, content: { parts: [{ text: 'Partial' }] } }], usageMetadata })}\n\n`
        );
        setTimeout(
          () =>
            res.end(
              mode === 'broken-json'
                ? 'data: {bad}\n\n'
                : mode === 'invalid-usage'
                  ? 'data: {"usageMetadata":{"promptTokenCount":2147483648}}\n\n'
                  : mode === 'error-event'
                    ? 'data: {"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"Denied"}}\n\n'
                    : ''
            ),
          10
        );
      };
      const baseUrl = await listen(app);
      const ai = new GoogleGenAI({
        apiKey: 'test-upstream-key',
        httpOptions: {
          baseUrl: `${baseUrl}${prefix}`,
          retryOptions: { attempts: 1 },
        },
      });
      let chunks = 0;
      await expect(
        (async () => {
          for await (const _chunk of await ai.models.generateContentStream({
            model: 'gemini',
            contents,
          }))
            chunks++;
        })()
      ).rejects.toThrow();
      expect(chunks).toBe(1);
      await vi.waitFor(() =>
        expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'Failed',
              inputToken: 100,
              outputToken: 20,
            }),
          })
        )
      );
      expect(checkQuotaAlert).toHaveBeenCalledWith(
        'workspace',
        'gateway',
        0.00026
      );
      expect(received).toHaveLength(1);
    }
  );

  test('treats safety blocking as a successful native terminal response', async () => {
    const blocked = { promptFeedback: { blockReason: 'SAFETY' } };
    relayHandler = (_req, res) => {
      res.type('text/event-stream').end(`data: ${JSON.stringify(blocked)}\n\n`);
    };
    expect((await post('streamGenerateContent')).text).toBe(
      `data: ${JSON.stringify(blocked)}\n\n`
    );
    await vi.waitFor(() =>
      expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Success',
            responsePayload: expect.objectContaining({
              gateway: expect.objectContaining({
                usageSource: 'unknown',
                priceKnown: false,
              }),
            }),
          }),
        })
      )
    );
  });

  test.each([false, true])(
    'aborts an idle upstream and finalizes the log, afterHeaders=%s',
    async (afterHeaders) => {
      let upstreamClosed = false;
      relayHandler = (_req, res) => {
        res.on('close', () => {
          upstreamClosed = true;
        });
        if (afterHeaders)
          res
            .type('text/event-stream')
            .write(
              `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Partial' }] } }] })}\n\n`
            );
      };
      vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
      });
      const resultPromise = post('streamGenerateContent').then(
        (result) => result
      );
      await vi.waitFor(() => expect(received).toHaveLength(1));
      // Allow the real HTTP body reader to consume the first chunk before advancing timers.
      if (afterHeaders)
        await vi.waitFor(() =>
          expect(prisma.aIGatewayLogs.create).toHaveBeenCalled()
        );
      await vi.advanceTimersByTimeAsync(120_001);
      const result = await resultPromise;
      expect(result.status).toBe(afterHeaders ? 200 : 504);
      expect(result.text).toContain('DEADLINE_EXCEEDED');
      vi.useRealTimers();
      await vi.waitFor(() => expect(upstreamClosed).toBe(true));
      await vi.waitFor(() =>
        expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: 'Failed' }),
          })
        )
      );
    }
  );

  test('cancelling the downstream closes the upstream and finalizes one failed log', async () => {
    let upstreamClosed = false;
    relayHandler = (_req, res) => {
      res.on('close', () => {
        upstreamClosed = true;
      });
      res
        .type('text/event-stream')
        .write(
          `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Partial' }] } }], usageMetadata })}\n\n`
        );
    };
    const baseUrl = await listen(app);
    const controller = new AbortController();
    const response = await fetch(
      `${baseUrl}${prefix}/v1beta/models/gemini:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': 'test-upstream-key',
        },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      }
    );
    await response.body!.getReader().read();
    controller.abort();
    await vi.waitFor(() => expect(upstreamClosed).toBe(true));
    await vi.waitFor(() =>
      expect(prisma.aIGatewayLogs.update).toHaveBeenCalledTimes(1)
    );
    expect(
      vi.mocked(prisma.aIGatewayLogs.update).mock.calls[0][0].data
    ).toMatchObject({
      status: 'Failed',
      responsePayload: { error: { code: 499 } },
    });
  });
  test.each(['v1', 'v1beta'])(
    'preserves %s, base path, slash alias, response and usage',
    async (version) => {
      const res = await post(
        'generateContent',
        { contents },
        'relay/gemini',
        version
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(response);
      expect(received).toHaveLength(1);
      expect(received[0].url).toBe(
        `/gemini/${version}/models/relay/gemini:generateContent`
      );
      expect(received[0].headers['x-goog-api-key']).toBe('test-upstream-key');
      expect(received[0].body.contents).toEqual(contents);
      await vi.waitFor(() =>
        expect(prisma.aIGatewayLogs.update).toHaveBeenCalled()
      );
      const log = vi.mocked(prisma.aIGatewayLogs.update).mock.calls[0][0].data;
      expect(log).toMatchObject({
        status: 'Success',
        inputToken: 100,
        outputToken: 20,
        cacheReadInputToken: 40,
      });
      expect(String(log.price)).toBe('0.00026');
    }
  );

  test('preserves tool IDs, signatures, schemas, thinking and all candidates', async () => {
    const parts = [
      {
        functionCall: { id: 'a', name: 'read', args: { path: 'a.txt' } },
        thoughtSignature: 'sig-a',
      },
      {
        functionCall: { id: 'b', name: 'read', args: { path: 'b.txt' } },
        thoughtSignature: 'sig-b',
      },
      { thoughtSignature: 'signature-only' },
    ];
    const body = {
      contents: [
        ...contents,
        { role: 'model', parts },
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                id: 'a',
                name: 'read',
                response: { output: 'uno' },
              },
            },
            {
              functionResponse: {
                id: 'b',
                name: 'read',
                response: { output: 'dos' },
              },
            },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: 'Use local tools.' }] },
      tools: [
        {
          functionDeclarations: [
            {
              name: 'read',
              parametersJsonSchema: {
                type: 'object',
                properties: { path: { type: 'string' } },
                additionalProperties: false,
              },
            },
          ],
        },
      ],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: {
        thinkingConfig: { thinkingBudget: 128, includeThoughts: true },
        candidateCount: 2,
        responseMimeType: 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };
    const nativeResponse = {
      ...response,
      candidates: [
        { index: 0, content: { role: 'model', parts }, finishReason: 'STOP' },
        {
          index: 1,
          content: { role: 'model', parts: [{ text: 'Otra' }] },
          finishReason: 'MAX_TOKENS',
        },
      ],
    };
    relayHandler = (_req, res) => {
      res.json(nativeResponse);
    };
    const result = await post('generateContent', body);
    expect(result.status).toBe(200);
    expect(result.body).toEqual(nativeResponse);
    expect(received[0].body).toEqual(body);
    expect(prisma.aIGatewayLogs.create).toHaveBeenCalledTimes(1);
  });

  test.each([false, true])(
    'counts the complete native request, nested=%s, without billing generation',
    async (nested) => {
      gateway.customModelName = 'fixed/model';
      relayHandler = (_req, res) => {
        res.json({ totalTokens: 42 });
      };
      const generateContentRequest = {
        model: 'models/auxiliary',
        contents,
        systemInstruction: { parts: [{ text: 'System' }] },
        tools: [{ functionDeclarations: [{ name: 'read' }] }],
      };
      const body = nested ? { generateContentRequest } : { contents };
      const result = await post('countTokens', body);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ totalTokens: 42 });
      expect(received[0].url).toBe(
        '/gemini/v1beta/models/fixed/model:countTokens'
      );
      expect(received[0].body).toEqual(
        nested
          ? {
              generateContentRequest: {
                ...generateContentRequest,
                model: 'models/fixed/model',
              },
            }
          : body
      );
      await vi.waitFor(() =>
        expect(prisma.aIGatewayLogs.update).toHaveBeenCalled()
      );
      expect(
        String(
          vi.mocked(prisma.aIGatewayLogs.update).mock.calls[0][0].data.price
        )
      ).toBe('0');
    }
  );

  test.each([401, 403, 404, 429, 500, 503])(
    'preserves upstream %s before SSE headers with no retry',
    async (code) => {
      relayHandler = (_req, res) => {
        res.status(code).json({
          error: {
            code,
            status: 'UPSTREAM_ERROR',
            message: 'Denied test-upstream-key',
          },
        });
      };
      const result = await post('streamGenerateContent');
      expect(result.status).toBe(code);
      expect(result.headers['content-type']).toContain('application/json');
      expect(result.body.error.code).toBe(code);
      expect(result.text).not.toContain('test-upstream-key');
      expect(received).toHaveLength(1);
      await vi.waitFor(() =>
        expect(prisma.aIGatewayLogs.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: 'Failed' }),
          })
        )
      );
    }
  );

  test('streams chunks and tail metadata to an official SDK client', async () => {
    const first = {
      candidates: [
        { index: 0, content: { role: 'model', parts: [{ text: 'Ho' }] } },
      ],
    };
    const tail = {
      ...response,
      candidates: [
        {
          index: 0,
          content: {
            role: 'model',
            parts: [{ thoughtSignature: 'tail-signature' }],
          },
          finishReason: 'STOP',
        },
      ],
    };
    relayHandler = (_req, res) => {
      res.type('text/event-stream');
      res.write(`data: ${JSON.stringify(first)}\n\n`);
      setTimeout(() => res.end(`data: ${JSON.stringify(tail)}\n\n`), 20);
    };
    const baseUrl = await listen(app);
    const ai = new GoogleGenAI({
      apiKey: 'test-upstream-key',
      httpOptions: { baseUrl: `${baseUrl}${prefix}` },
    });
    const chunks = [];
    for await (const chunk of await ai.models.generateContentStream({
      model: 'relay/gemini',
      contents,
      config: { automaticFunctionCalling: { disable: true } },
    })) {
      const { sdkHttpResponse: _headers, ...data } = chunk;
      chunks.push(data);
    }
    expect(chunks).toEqual([first, tail]);
    expect(received[0].url).toBe(
      '/gemini/v1beta/models/relay/gemini:streamGenerateContent?alt=sse'
    );
  });

  test.each([
    { contents, httpOptions: { baseUrl: 'https://invalid.example' } },
    {
      contents,
      generationConfig: {
        httpOptions: { headers: { 'x-goog-api-key': 'evil' } },
      },
    },
    { contents, config: { apiKey: 'evil' } },
    { contents, unknownField: true },
  ])(
    'rejects unsupported or transport fields without contacting upstream',
    async (body) => {
      expect((await post('generateContent', body)).status).toBe(400);
      expect(received).toHaveLength(0);
    }
  );
  test('rejects ambiguous count inputs', async () => {
    expect(
      (
        await post('countTokens', {
          contents,
          generateContentRequest: { contents },
        })
      ).status
    ).toBe(400);
  });
  test('rejects conflicting credentials and missing credentials', async () => {
    const conflict = await post().set('authorization', 'Bearer different-key');
    expect(conflict.body).toMatchObject({
      error: { code: 400, message: 'Conflicting API keys.' },
    });
    expect(conflict.status).toBe(400);
    expect(
      (
        await request(app)
          .post(`${prefix}/v1beta/models/gemini:generateContent`)
          .send({ contents })
      ).status
    ).toBe(401);
    expect(received).toHaveLength(0);
  });
  test.each([
    '',
    '%ZZ',
    'https%3A%2F%2Fevil.example',
    'm%3Fx=1',
    'm%252f..',
    'a//b',
  ])('rejects unsafe model %s', async (model) => {
    expect((await post('generateContent', { contents }, model)).status).toBe(
      400
    );
    expect(received).toHaveLength(0);
  });
  test('rejects traversal sent without client URL normalization', async () => {
    const url = new URL(await listen(app));
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = httpRequest(
        {
          hostname: url.hostname,
          port: url.port,
          method: 'POST',
          path: `${prefix}/v1beta/models/a/%2e%2e/b:generateContent`,
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': 'test-upstream-key',
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );
      req.on('error', reject);
      req.end(JSON.stringify({ contents }));
    });
    expect(status).toBe(400);
    expect(received).toHaveLength(0);
  });
  test.each([
    undefined,
    'https://relay.example/%ZZ',
    'https://relay.example/v1beta',
    'https://relay.example/v1',
    'https://relay.example/v1beta/models/m:generateContent',
  ])('rejects an invalid saved base URL', async (baseUrl) => {
    gateway.customModelBaseUrl = baseUrl;
    expect((await post()).status).toBe(400);
    expect(received).toHaveLength(0);
  });
  test('returns 405 for known actions with the wrong method', async () => {
    expect(
      (
        await request(app).get(
          `${prefix}/v1beta/models/relay/gemini:generateContent`
        )
      ).status
    ).toBe(405);
  });
});
