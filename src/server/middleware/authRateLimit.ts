import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { TRPCError } from '@trpc/server';
import type { Request, RequestHandler } from 'express';
import { Redis } from 'ioredis';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

const policies = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  password: { limit: 5, windowMs: 15 * 60_000 },
  token: { limit: 30, windowMs: 15 * 60_000 },
  email: { limit: 5, windowMs: 15 * 60_000 },
};
type Policy = keyof typeof policies;

export const authRateLimitProcedures: Record<string, Policy | undefined> = {
  'user.login': 'login',
  'user.register': 'register',
  'user.loginWithToken': 'token',
  'user.changePassword': 'password',
  'workspace.invite': 'email',
  'workspace.acceptInvitation': 'token',
  'workspace.getInvitationInfo': 'token',
};

// Increment and expiration must be atomic across requests and server instances.
const consumeScript = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

let redisClient: Promise<Redis> | undefined;
function getRedisClient(url: string): Promise<Redis> {
  if (!redisClient) {
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    });
    client.on('error', () =>
      logger.warn('Authentication rate limit Redis unavailable')
    );
    redisClient = client
      .connect()
      .then(() => client)
      .catch((error) => {
        client.disconnect();
        redisClient = undefined;
        throw error;
      });
  }
  return redisClient;
}

function getRateLimitIp(req: Request): string {
  // Only trust a forwarded header explicitly configured for the deployment.
  const header = process.env.CLIENT_IP_HEADER?.toLowerCase();
  const forwarded = header ? req.headers[header] : undefined;
  const ip =
    typeof forwarded === 'string' && isIP(forwarded.trim())
      ? forwarded.trim()
      : (req.socket.remoteAddress ?? 'unknown');
  return isIP(ip) === 6 ? new URL(`http://[${ip}]`).hostname.slice(1, -1) : ip;
}

export async function consumeAuthRateLimit(
  req: Request,
  policy: Policy
): Promise<number> {
  if (!env.auth.rateLimitEnabled || !env.cache.redisUrl) return 0;

  const { limit, windowMs } = policies[policy];
  const ipHash = createHash('sha256').update(getRateLimitIp(req)).digest('hex');
  try {
    const client = await getRedisClient(env.cache.redisUrl);
    const [count, ttl] = (await client.eval(
      consumeScript,
      1,
      `tianji:auth-rate-limit:${policy}:${ipHash}`,
      windowMs
    )) as [number, number];
    return count > limit ? Math.max(1, Math.ceil(ttl / 1000)) : 0;
  } catch {
    throw new TRPCError({
      code: 'SERVICE_UNAVAILABLE',
      message:
        'Authentication is temporarily unavailable. Please try again later.',
    });
  }
}

export function authRateLimitMessage(retryAfter: number): string {
  return `Too many requests. Please retry in ${retryAfter} seconds.`;
}

export const authRateLimit: RequestHandler = async (req, res, next) => {
  // Auth.js normalizes the original URL before parsing its action and provider.
  const pathname = new URL(req.originalUrl, 'http://localhost').pathname;
  const [action, provider] = pathname
    .slice(req.baseUrl.length)
    .split('/')
    .filter(Boolean);
  let policy: Policy | undefined;
  if (action === 'callback') {
    policy = provider === 'account' ? 'login' : 'token';
  } else if (action === 'signin' && req.method === 'POST') {
    policy = provider === 'email' ? 'email' : 'token';
  }
  if (!policy || !provider) return next();

  try {
    const retryAfter = await consumeAuthRateLimit(req, policy);
    if (!retryAfter) return next();
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: authRateLimitMessage(retryAfter),
      url: `${req.protocol}://${req.get('host')}/api/auth/error?error=TooManyRequests`,
    });
  } catch {
    res.status(503).json({
      error:
        'Authentication is temporarily unavailable. Please try again later.',
      url: `${req.protocol}://${req.get('host')}/api/auth/error?error=ServiceUnavailable`,
    });
  }
};
