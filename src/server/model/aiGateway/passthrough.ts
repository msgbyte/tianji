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
    const baseUrl = options.baseUrl ?? gatewayInfo.customModelBaseUrl;
    if (!baseUrl) {
      res.status(400).json({ message: 'Custom model base URL is required.' });
      return;
    }

    // Resolve full API paths from root, /v1, /api, or /api/v1 base URLs.
    const prefix = baseUrl
      .replace(/\/+$/, '')
      .replace(/\/v1$/, '')
      .replace(/\/api$/, '');
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex < 0 ? '' : req.originalUrl.slice(queryIndex);
    const url = new URL(`${prefix}${options.path}${query}`);
    const transport = url.protocol === 'https:' ? https : http;
    const upstream = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          ...buildAIGatewayForwardHeaders(req),
          ...options.header?.(req),
          authorization: `Bearer ${modelApiKey}`,
          'content-type': req.get('content-type') ?? 'application/json',
          accept: req.get('accept') ?? '*/*',
        },
      },
      (response) => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.on('error', () => res.destroy());
        response.pipe(res);
      }
    );
    res.on('close', () => upstream.destroy());
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
    upstream.end(
      Buffer.isBuffer(req.rawBody) ? req.rawBody : JSON.stringify(req.body)
    );
  };
}
