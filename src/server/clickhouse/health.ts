import { clickhouse } from './index.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

export class ClickHouseHealthManager {
  private static instance: ClickHouseHealthManager;
  private isHealthy: boolean = false;
  private lastCheckTime: number = 0;
  private checkInterval: number = env.clickhouse.fallback.healthCheckInterval;
  private retryInterval: number = env.clickhouse.fallback.retryInterval;
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number =
    env.clickhouse.fallback.maxConsecutiveFailures;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  private constructor() {
    this.initializeHealthCheck();
  }

  public static getInstance(): ClickHouseHealthManager {
    if (!ClickHouseHealthManager.instance) {
      ClickHouseHealthManager.instance = new ClickHouseHealthManager();
    }
    return ClickHouseHealthManager.instance;
  }

  /**
   * Initialize health check
   */
  private initializeHealthCheck(): void {
    if (!env.clickhouse.enable) {
      return;
    }

    this.startHealthCheck();
  }

  /**
   * Start health check
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
    }

    this.healthCheckTimer = setTimeout(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    this.lastCheckTime = Date.now();

    try {
      // Perform simple ping check
      const startTime = Date.now();
      const pingResult = (await Promise.race([
        clickhouse.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        ),
      ])) as { success: boolean };

      const duration = Date.now() - startTime;

      if (pingResult.success && duration < 5000) {
        // Health check successful
        if (!this.isHealthy) {
          logger.info(
            'ClickHouse health check passed - switching back to ClickHouse'
          );
          this.isHealthy = true;
        }
        this.consecutiveFailures = 0;
        this.scheduleNextCheck(this.checkInterval);
      } else {
        this.handleHealthCheckFailure('Ping failed or too slow');
      }
    } catch (error) {
      this.handleHealthCheckFailure(`Health check error: ${error}`);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Handle health check failure
   */
  private handleHealthCheckFailure(reason: string): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      if (this.isHealthy) {
        logger.warn(
          `ClickHouse health check failed ${this.consecutiveFailures} times - switching to PostgreSQL fallback. Reason: ${reason}`
        );
        this.isHealthy = false;
      }
      this.scheduleNextCheck(this.retryInterval);
    } else {
      logger.debug(
        `ClickHouse health check failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}): ${reason}`
      );
      this.scheduleNextCheck(this.checkInterval);
    }
  }

  /**
   * Schedule next check
   */
  private scheduleNextCheck(interval: number): void {
    this.healthCheckTimer = setTimeout(() => {
      this.performHealthCheck();
    }, interval);
  }

  /**
   * Get ClickHouse health status
   */
  public isClickHouseHealthy(): boolean {
    return (
      env.clickhouse.enable &&
      (this.isHealthy || !env.clickhouse.fallback.enableFallback)
    );
  }

  /**
   * Force health check
   */
  public async forceHealthCheck(): Promise<boolean> {
    if (!env.clickhouse.enable) {
      return false;
    }

    await this.performHealthCheck();
    return this.isHealthy;
  }

  /**
   * Get health status information
   */
  public getHealthStatus(): {
    enabled: boolean;
    healthy: boolean;
    lastCheckTime: number;
    consecutiveFailures: number;
  } {
    return {
      enabled: env.clickhouse.enable,
      healthy: this.isHealthy,
      lastCheckTime: this.lastCheckTime,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Stop health check
   */
  public stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Manually set health status (for testing)
   */
  public setHealthy(healthy: boolean): void {
    if (env.isDev) {
      this.isHealthy = healthy;
      logger.info(`ClickHouse health status manually set to: ${healthy}`);
    }
  }
}

// Export singleton instance
export const clickhouseHealthManager = ClickHouseHealthManager.getInstance();
