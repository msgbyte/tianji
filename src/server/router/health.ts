import { Router } from 'express';
import { version } from '@tianji/shared';
import { prisma } from '../model/_client.js';
import { getCacheManager } from '../cache/index.js';
import { logger } from '../utils/logger.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  const startTime = Date.now();
  const checks: Record<
    string,
    { status: 'healthy' | 'unhealthy'; duration?: number; error?: string }
  > = {};

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        duration: Date.now() - dbStartTime,
      };
    } catch (dbError) {
      logger.error('[HealthCheck] Database connection failed:', dbError);
      checks.database = {
        status: 'unhealthy',
        duration: Date.now() - dbStartTime,
        error: 'Database connection failed',
      };
    }

    // Check cache connectivity
    const cacheStartTime = Date.now();
    try {
      const cacheManager = await getCacheManager();
      const testKey = 'healthcheck:test';
      const testValue = 'ok';

      // Test cache write and read
      await cacheManager.set(testKey, testValue, 1000); // 1 second TTL
      const retrievedValue = await cacheManager.get(testKey);

      if (retrievedValue === testValue) {
        checks.cache = {
          status: 'healthy',
          duration: Date.now() - cacheStartTime,
        };
      } else {
        checks.cache = {
          status: 'unhealthy',
          duration: Date.now() - cacheStartTime,
          error: 'Cache read/write test failed',
        };
      }
    } catch (cacheError) {
      logger.error('[HealthCheck] Cache connection failed:', cacheError);
      checks.cache = {
        status: 'unhealthy',
        duration: Date.now() - cacheStartTime,
        error: 'Cache connection failed',
      };
    }

    // Determine overall health status
    const isHealthy = Object.values(checks).every(
      (check) => check.status === 'healthy'
    );
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      version,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      checks,
    });
  } catch (error) {
    logger.error('[HealthCheck] Unexpected error during health check:', error);

    res.status(503).json({
      status: 'unhealthy',
      version,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: 'Unexpected health check error',
      checks,
    });
  }
});
