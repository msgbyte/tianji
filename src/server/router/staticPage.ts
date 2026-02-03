import { Response } from 'express';
import { Router } from 'express';
import { getCacheManager } from '../cache/index.js';
import { prisma } from '../model/_client.js';

const CACHE_KEY_PREFIX = 'static-page:';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const CACHE_CONTROL = 'public, max-age=300'; // 5 min for client/CDN

/** Call when a static page is updated or deleted to invalidate cache. */
export async function invalidateStaticPageCache(slug: string): Promise<void> {
  const cache = await getCacheManager();
  await cache.delete(CACHE_KEY_PREFIX + slug);
}

/** Serve static page HTML by slug. Returns true if sent, false if not found. */
export async function serveStaticPageBySlug(
  slug: string,
  res: Response
): Promise<boolean> {
  const cache = await getCacheManager();
  const cached = await cache.get(CACHE_KEY_PREFIX + slug);
  if (cached != null) {
    res.set('Cache-Control', CACHE_CONTROL);
    res.type('text/html').send(String(cached));
    return true;
  }
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || page.type !== 'static') {
    return false;
  }
  const html = (page.payload as { html?: string })?.html ?? '';
  await cache.set(CACHE_KEY_PREFIX + slug, html, CACHE_TTL_MS);
  res.set('Cache-Control', CACHE_CONTROL);
  res.type('text/html').send(html);
  return true;
}

export const staticPageRouter = Router();

/**
 * GET /p/:slug - serve static page HTML directly (no iframe).
 * Falls through to next() when not found or not Accept: html.
 */
staticPageRouter.get('/:slug', async (req, res, next) => {
  if (!req.accepts('html')) {
    next();
    return;
  }
  const sent = await serveStaticPageBySlug(req.params.slug as string, res);
  if (!sent) next();
});
