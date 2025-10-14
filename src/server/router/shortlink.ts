import { Router } from 'express';
import { param, validate } from '../middleware/validate.js';
import {
  getShortLinkByCode,
  recordShortLinkAccess,
} from '../model/shortlink.js';
import { logger } from '../utils/logger.js';

export const shortlinkRouter = Router();

/**
 * Access short link and redirect
 * GET /:code
 */
shortlinkRouter.get(
  '/:code',
  validate(param('code').isString()),
  async (req, res) => {
    try {
      const { code } = req.params;

      const shortLink = await getShortLinkByCode(code);

      if (!shortLink) {
        return res.status(404).json({
          success: false,
          error: 'Short link not found',
        });
      }

      if (!shortLink.enabled) {
        return res.status(403).json({
          success: false,
          error: 'Short link is disabled',
        });
      }

      if (shortLink.deletedAt) {
        return res.status(410).json({
          success: false,
          error: 'Short link has been deleted',
        });
      }

      const referrer = req.get('referer') || req.get('referrer');
      recordShortLinkAccess(shortLink.id, req, referrer).catch((error) => {
        logger.error('Failed to record short link access:', error);
      });

      res.redirect(302, shortLink.originalUrl);
    } catch (error) {
      logger.error('Short link access error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
