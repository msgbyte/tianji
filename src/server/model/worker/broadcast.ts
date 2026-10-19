import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { env } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

export const WORKER_CRON_BROADCAST_CHANNEL = 'tianji:worker:cron:lifecycle';

export type WorkerCronBroadcastAction =
  | 'create'
  | 'update'
  | 'start'
  | 'stop'
  | 'delete';

export interface WorkerCronBroadcastEvent {
  action: WorkerCronBroadcastAction;
  workspaceId: string;
  workerId: string;
  sourceInstanceId: string;
}

type WorkerCronBroadcastHandler = (
  event: WorkerCronBroadcastEvent
) => void | Promise<void>;

interface RedisClient {
  on(event: string, listener: (...args: any[]) => void): unknown;
  subscribe(channel: string): Promise<unknown>;
  publish(channel: string, message: string): Promise<unknown>;
  quit(): Promise<unknown>;
}

type RedisClientFactory = (url: string) => RedisClient;

const workerCronBroadcastEventSchema = z.object({
  action: z.enum(['create', 'update', 'start', 'stop', 'delete']),
  workspaceId: z.string(),
  workerId: z.string(),
  sourceInstanceId: z.string(),
});

export class WorkerCronBroadcast {
  private publisher?: RedisClient;
  private subscriber?: RedisClient;
  private starting?: Promise<boolean>;
  private closing?: Promise<void>;
  private subscribed = false;
  private subscribing?: Promise<void>;
  private closed = false;
  private startupWaitFinished = false;
  private hasSubscribed = false;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private recover?: () => void | Promise<void>;
  private resolveFirstReady?: () => void;
  private connectionVersion = 0;

  constructor(
    private readonly redisUrl: string | undefined,
    private readonly instanceId: string,
    private readonly createClient: RedisClientFactory
  ) {}

  async start(
    handler: WorkerCronBroadcastHandler,
    recover: () => void | Promise<void>,
    readinessTimeoutMs = 5_000
  ): Promise<boolean> {
    if (this.closed) {
      return false;
    }

    if (!this.redisUrl) {
      return true;
    }

    if (this.starting) {
      return this.starting;
    }

    if (this.publisher || this.subscriber) {
      return this.subscribed;
    }

    const starting = this.initialize(
      this.redisUrl,
      handler,
      recover,
      readinessTimeoutMs
    );
    this.starting = starting;
    try {
      return await starting;
    } finally {
      if (this.starting === starting) {
        this.starting = undefined;
      }
    }
  }

  private async initialize(
    redisUrl: string,
    handler: WorkerCronBroadcastHandler,
    recover: () => void | Promise<void>,
    readinessTimeoutMs: number
  ): Promise<boolean> {
    try {
      this.publisher = this.createClient(redisUrl);
      this.subscriber = this.createClient(redisUrl);
      this.recover = recover;

      this.publisher.on('error', (err) => {
        logger.error('[WorkerCronBroadcast] Redis publisher error:', err);
      });
      this.subscriber.on('error', (err) => {
        logger.error('[WorkerCronBroadcast] Redis subscriber error:', err);
      });
      this.subscriber.on('ready', () => {
        this.ensureSubscribed();
      });
      this.subscriber.on('close', () => {
        this.markDisconnected();
      });
      this.subscriber.on('end', () => {
        this.markDisconnected();
      });
      this.subscriber.on('message', (channel, raw) => {
        if (this.closed || channel !== WORKER_CRON_BROADCAST_CHANNEL) {
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(String(raw));
        } catch {
          return;
        }

        const event = workerCronBroadcastEventSchema.safeParse(parsed);
        if (
          !event.success ||
          event.data.sourceInstanceId === this.instanceId
        ) {
          return;
        }

        try {
          void Promise.resolve(handler(event.data)).catch((err) => {
            logger.error('[WorkerCronBroadcast] Handler error:', err);
          });
        } catch (err) {
          logger.error('[WorkerCronBroadcast] Handler error:', err);
        }
      });

      const firstReady = new Promise<void>((resolve) => {
        this.resolveFirstReady = resolve;
      });
      this.ensureSubscribed();

      let readinessTimer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<boolean>((resolve) => {
        readinessTimer = setTimeout(() => resolve(false), readinessTimeoutMs);
        readinessTimer.unref?.();
      });
      const ready = firstReady.then(() => true);
      const subscribed = await Promise.race([ready, timedOut]);
      if (readinessTimer) {
        clearTimeout(readinessTimer);
      }
      this.startupWaitFinished = true;

      return subscribed;
    } catch (err) {
      logger.error('[WorkerCronBroadcast] Failed to initialize Redis:', err);
      return false;
    }
  }

  private markDisconnected(): void {
    this.subscribed = false;
    this.subscribing = undefined;
    this.connectionVersion += 1;
  }

  private ensureSubscribed(): void {
    if (
      this.closed ||
      !this.subscriber ||
      this.subscribed ||
      this.subscribing
    ) {
      return;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }

    const connectionVersion = this.connectionVersion;
    const attempt = this.subscribe(connectionVersion);
    this.subscribing = attempt;
    void attempt.finally(() => {
      if (this.subscribing === attempt) {
        this.subscribing = undefined;
      }

      if (!this.closed && !this.subscribed && !this.subscribing) {
        this.scheduleRetry();
      }
    });
  }

  private async subscribe(connectionVersion: number): Promise<void> {
    try {
      await this.subscriber?.subscribe(WORKER_CRON_BROADCAST_CHANNEL);
      if (
        this.closed ||
        !this.subscriber ||
        connectionVersion !== this.connectionVersion
      ) {
        return;
      }

      const shouldRecover = this.startupWaitFinished || this.hasSubscribed;
      this.subscribed = true;
      this.hasSubscribed = true;
      this.resolveFirstReady?.();
      this.resolveFirstReady = undefined;

      if (shouldRecover) {
        this.runRecovery();
      }
    } catch (err) {
      logger.error('[WorkerCronBroadcast] Redis subscribe error:', err);
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) {
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.ensureSubscribed();
    }, 1_000);
    this.retryTimer.unref?.();
  }

  private runRecovery(): void {
    try {
      void Promise.resolve(this.recover?.()).catch((err) => {
        logger.error('[WorkerCronBroadcast] Recovery error:', err);
      });
    } catch (err) {
      logger.error('[WorkerCronBroadcast] Recovery error:', err);
    }
  }

  async close(): Promise<void> {
    if (this.closing) {
      return this.closing;
    }

    this.closed = true;
    this.subscribed = false;
    this.connectionVersion += 1;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }

    const publisher = this.publisher;
    const subscriber = this.subscriber;
    this.publisher = undefined;
    this.subscriber = undefined;

    this.closing = this.closeClients(publisher, subscriber);
    return this.closing;
  }

  private async closeClients(
    publisher: RedisClient | undefined,
    subscriber: RedisClient | undefined
  ): Promise<void> {
    const results = await Promise.allSettled(
      [publisher, subscriber]
        .filter((client): client is RedisClient => Boolean(client))
        .map((client) => Promise.resolve().then(() => client.quit()))
    );
    results.forEach((result) => {
      if (result.status === 'rejected') {
        logger.error('[WorkerCronBroadcast] Redis cleanup error:', result.reason);
      }
    });
  }

  async publish(
    action: WorkerCronBroadcastAction,
    workspaceId: string,
    workerId: string
  ): Promise<void> {
    if (this.closed || !this.publisher) {
      return;
    }

    const event: WorkerCronBroadcastEvent = {
      action,
      workspaceId,
      workerId,
      sourceInstanceId: this.instanceId,
    };

    try {
      await this.publisher.publish(
        WORKER_CRON_BROADCAST_CHANNEL,
        JSON.stringify(event)
      );
    } catch (err) {
      logger.error('[WorkerCronBroadcast] Redis publish error:', err);
    }
  }
}

export const workerCronBroadcast = new WorkerCronBroadcast(
  env.cache.redisUrl,
  nanoid(),
  (url) => new Redis(url)
);
