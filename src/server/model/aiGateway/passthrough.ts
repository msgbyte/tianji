import type { Request, RequestHandler } from 'express';
import http from 'node:http';
import https from 'node:https';
import {
  buildAIGatewayForwardHeaders,
  resolveAIGatewayModelApiKey,
} from '../aiGateway.js';

export function buildAIGatewayPassthroughHandler(options: {
  path: string;
  baseUrl?: string;
  header?: (req: Request) => Record<string, string>;
}): RequestHandler {
  return async (req, res, next) => {
    const { gatewayInfo, modelApiKey } = await resolveAIGatewayModelApiKey({
      workspaceId: req.params.workspaceId,
      gatewayId: req.params.gatewayId,
      requestApiKey: (req.headers.authorization ?? '').replace('Bearer ', ''),
    });
    if (req.aborted || res.destroyed) return;
    const baseUrl = options.baseUrl ?? gatewayInfo.customModelBaseUrl;
    if (!baseUrl) {
      res.status(400).json({ message: 'Custom model base URL is required.' });
      return;
    }

    let prefix = baseUrl;
    while (prefix.endsWith('/')) prefix = prefix.slice(0, -1);
    if (prefix.endsWith('/v1')) prefix = prefix.slice(0, -3);
    if (options.path.startsWith('/api/') && prefix.endsWith('/api')) {
      prefix = prefix.slice(0, -4);
    }
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex < 0 ? '' : req.originalUrl.slice(queryIndex);
    const url = new URL(`${prefix}${options.path}${query}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      res.status(400).json({ message: 'Upstream URL must use HTTP or HTTPS.' });
      return;
    }
    const body = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : JSON.stringify(req.body);
    const headers: Record<string, string> = {
      ...buildAIGatewayForwardHeaders(req),
      ...options.header?.(req),
      authorization: `Bearer ${modelApiKey}`,
      'content-type': req.get('content-type') ?? 'application/json',
      accept: req.get('accept') ?? '*/*',
    };
    if (body === undefined) {
      for (const name of ['content-length', 'content-encoding']) {
        const value = req.get(name);
        if (value) headers[name] = value;
      }
    }
    const transport = url.protocol === 'https:' ? https : http;
    const upstream = transport.request(
      url,
      {
        method: 'POST',
        headers,
      },
      (response) => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.on('error', () => res.destroy());
        response.pipe(res);
        response.on('data', () => res.flush?.());
      }
    );
    res.once('close', () => {
      req.unpipe(upstream);
      upstream.destroy();
    });
    req.once('aborted', () => upstream.destroy());
    upstream.on('error', () => {
      if (res.destroyed) return;
      if (res.headersSent) {
        res.destroy();
      } else {
        next(
          Object.assign(new Error('Upstream request failed.'), { status: 502 })
        );
      }
    });
    if (body === undefined) req.pipe(upstream);
    else upstream.end(body);
  };
}
