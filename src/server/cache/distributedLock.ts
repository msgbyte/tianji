import { getCacheManager } from './index.js';
import { logger } from '../utils/logger.js';
import { nanoid } from 'nanoid';
import { sleep } from '@tianji/shared';

export interface DistributedLockOptions {
  /**
   * Lock timeout in milliseconds (default: 30000ms = 30s)
   * After this time, the lock will be automatically released
   */
  timeout?: number;

  /**
   * Retry interval in milliseconds (default: 100ms)
   * Time to wait before retrying to acquire the lock
   */
  retryInterval?: number;

  /**
   * Maximum retry attempts (default: 30)
   * Maximum number of times to retry acquiring the lock
   */
  maxRetries?: number;

  /**
   * Lock key prefix (default: 'tianji-lock')
   */
  prefix?: string;

  /**
   * Skip execution if lock cannot be acquired immediately (default: false)
   * When true, will not retry and return immediately if lock is not available
   *
   * @default true
   */
  skipOnFailure?: boolean;
}

export interface LockResult {
  /**
   * Whether the lock was successfully acquired
   */
  acquired: boolean;

  /**
   * Lock identifier (used for releasing the lock)
   */
  lockId?: string;

  /**
   * Release function to manually release the lock
   */
  release?: () => Promise<void>;
}

/**
 * Distributed lock implementation using Keyv cache manager
 */
export class DistributedLock {
  private readonly options: Required<DistributedLockOptions>;

  constructor(options: DistributedLockOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 30000, // 30 seconds
      retryInterval: options.retryInterval ?? 100, // 100ms
      maxRetries: options.maxRetries ?? 30, // 30 retries
      prefix: options.prefix ?? 'tianji-lock',
      skipOnFailure: options.skipOnFailure ?? true,
    };
  }

  /**
   * Acquire a distributed lock
   * @param lockName - Name of the lock
   * @param options - Override default options for this specific lock
   * @returns Promise<LockResult>
   */
  async acquire(
    lockName: string,
    options?: Partial<DistributedLockOptions>
  ): Promise<LockResult> {
    const opts = { ...this.options, ...options };
    const cacheManager = await getCacheManager();
    const lockKey = `${opts.prefix}:${lockName}`;
    const lockId = nanoid();
    const lockValue = {
      id: lockId,
      acquiredAt: Date.now(),
      acquiredBy: process.pid.toString(), // Use process ID as identifier
    };

    let retries = 0;
    const maxRetries = opts.skipOnFailure ? 1 : opts.maxRetries;

    while (retries < maxRetries) {
      try {
        // Try to acquire the lock
        const existingLock = await cacheManager.get(lockKey);

        if (!existingLock) {
          // Lock is available, try to acquire it
          await cacheManager.set(
            lockKey,
            JSON.stringify(lockValue),
            opts.timeout
          );

          await sleep(Math.random() * 100); // NOTICE: avoid setting too quickly to conflict

          // Verify we actually got the lock (handle race conditions)
          const verifyLock = await cacheManager.get(lockKey);
          if (verifyLock) {
            const parsedLock = JSON.parse(String(verifyLock));
            if (parsedLock.id === lockId) {
              logger.debug(
                `[DistributedLock] Successfully acquired lock: ${lockName}`
              );

              return {
                acquired: true,
                lockId,
                release: async () => {
                  await this.release(lockName, lockId);
                },
              };
            }
          }
        } else {
          // Check if the existing lock has expired
          const parsedLock = JSON.parse(String(existingLock));
          const lockAge = Date.now() - parsedLock.acquiredAt;

          if (lockAge > opts.timeout) {
            // Lock has expired, try to clean it up and retry
            logger.warn(
              `[DistributedLock] Found expired lock: ${lockName}, cleaning up`
            );
            await cacheManager.delete(lockKey);
            continue; // Retry immediately
          }
        }

        // If skipOnFailure is true, don't retry
        if (opts.skipOnFailure) {
          logger.debug(
            `[DistributedLock] Lock ${lockName} is held by another process, skipping (skipOnFailure=true)`
          );
          break;
        }

        // Lock is held by someone else, wait and retry
        logger.debug(
          `[DistributedLock] Lock ${lockName} is held by another process, retrying (${retries + 1}/${maxRetries})`
        );

        await sleep(opts.retryInterval);
        retries++;
      } catch (error) {
        logger.error(
          `[DistributedLock] Error acquiring lock ${lockName}:`,
          error
        );
        retries++;

        if (retries < maxRetries && !opts.skipOnFailure) {
          await sleep(opts.retryInterval);
        }
      }
    }

    const message = opts.skipOnFailure
      ? `[DistributedLock] Skipped execution for lock: ${lockName} (skipOnFailure=true)`
      : `[DistributedLock] Failed to acquire lock: ${lockName} after ${maxRetries} retries`;

    logger.warn(message);
    return { acquired: false };
  }

  /**
   * Release a distributed lock
   * @param lockName - Name of the lock
   * @param lockId - Lock identifier returned when acquiring the lock
   * @returns Promise<boolean> - Whether the lock was successfully released
   */
  async release(lockName: string, lockId: string): Promise<boolean> {
    try {
      const cacheManager = await getCacheManager();
      const lockKey = `${this.options.prefix}:${lockName}`;

      const existingLock = await cacheManager.get(lockKey);
      if (existingLock) {
        const parsedLock = JSON.parse(String(existingLock));

        // Only release if we own the lock
        if (parsedLock.id === lockId) {
          await cacheManager.delete(lockKey);
          logger.debug(
            `[DistributedLock] Successfully released lock: ${lockName}`
          );
          return true;
        } else {
          logger.warn(
            `[DistributedLock] Cannot release lock ${lockName}: lock is owned by different process (${parsedLock.id} vs ${lockId})`
          );
          return false;
        }
      } else {
        logger.debug(
          `[DistributedLock] Lock ${lockName} was already released or expired`
        );
        return true;
      }
    } catch (error) {
      logger.error(
        `[DistributedLock] Error releasing lock ${lockName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   * @param lockName - Name of the lock
   * @param fn - Function to execute while holding the lock
   * @param options - Lock options
   * @returns Promise<T> - Result of the function execution
   */
  async withLock<T>(
    lockName: string,
    fn: () => Promise<T>,
    options?: Partial<DistributedLockOptions>
  ): Promise<T | null> {
    const lockResult = await this.acquire(lockName, options);

    if (!lockResult.acquired) {
      const skipMessage = options?.skipOnFailure
        ? `[DistributedLock] Skipping execution for: ${lockName} (skipOnFailure=true)`
        : `[DistributedLock] Could not acquire lock for: ${lockName}, skipping execution`;

      logger.debug(skipMessage);
      return null;
    }

    try {
      logger.info(
        `[DistributedLock] Executing function with lock: ${lockName}`
      );
      const result = await fn();
      logger.info(
        `[DistributedLock] Function completed successfully with lock: ${lockName}`
      );
      return result;
    } catch (error) {
      logger.error(
        `[DistributedLock] Error executing function with lock ${lockName}:`,
        error
      );
      throw error;
    } finally {
      if (lockResult.release) {
        await lockResult.release();
      }
    }
  }

  /**
   * Check if a lock is currently held
   * @param lockName - Name of the lock
   * @returns Promise<boolean> - Whether the lock is currently held
   */
  async isLocked(lockName: string): Promise<boolean> {
    try {
      const cacheManager = await getCacheManager();
      const lockKey = `${this.options.prefix}:${lockName}`;
      const existingLock = await cacheManager.get(lockKey);

      if (!existingLock) {
        return false;
      }

      const parsedLock = JSON.parse(String(existingLock));
      const lockAge = Date.now() - parsedLock.acquiredAt;

      // Check if lock has expired
      if (lockAge > this.options.timeout) {
        // Clean up expired lock
        await cacheManager.delete(lockKey);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(
        `[DistributedLock] Error checking lock status ${lockName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get information about a lock
   * @param lockName - Name of the lock
   * @returns Promise<LockInfo | null> - Lock information or null if not locked
   */
  async getLockInfo(lockName: string): Promise<{
    id: string;
    acquiredAt: number;
    acquiredBy: string;
    age: number;
  } | null> {
    try {
      const cacheManager = await getCacheManager();
      const lockKey = `${this.options.prefix}:${lockName}`;
      const existingLock = await cacheManager.get(lockKey);

      if (!existingLock) {
        return null;
      }

      const parsedLock = JSON.parse(String(existingLock));
      return {
        ...parsedLock,
        age: Date.now() - parsedLock.acquiredAt,
      };
    } catch (error) {
      logger.error(
        `[DistributedLock] Error getting lock info ${lockName}:`,
        error
      );
      return null;
    }
  }
}

// Default instance for convenience
export const distributedLock = new DistributedLock();

/**
 * Convenience function to execute code with a distributed lock
 * @param lockName - Name of the lock
 * @param fn - Function to execute
 * @param options - Lock options
 * @returns Promise<T | null> - Result or null if lock couldn't be acquired
 */
export async function withDistributedLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  options?: Partial<DistributedLockOptions>
): Promise<T | null> {
  return distributedLock.withLock(lockName, fn, options);
}
