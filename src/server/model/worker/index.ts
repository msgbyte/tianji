import { FunctionWorkerExecutionStatus, Prisma } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { prisma } from '../_client.js';
import { isPlainObject } from 'lodash-es';
import { logger } from '../../utils/logger.js';
import { buildQueryWithCache } from '../../cache/index.js';
import {
  promWorkerExecutionCounter,
  promWorkerExecutionDuration,
  promWorkerCPUTime,
  promWorkerMemoryUsage,
  promWorkerRequestPayloadSize,
} from '../../utils/prometheus/client.js';
import { createId } from '@paralleldrive/cuid2';
import { createBatchWriter } from '../../utils/batchWriter.js';
import { env } from '../../utils/env.js';
import { loadWorkerEnvironmentForExecution } from './environment.js';

const execRecordWriter = createBatchWriter<Prisma.FunctionWorkerExecutionCreateManyInput>({
  name: 'WorkerExecution',
  flush: (batch) =>
    prisma.functionWorkerExecution.createMany({ data: batch }).then(() => {}),
});

function shouldStoreWorkerRequestPayload(workerId?: string) {
  if (!workerId) {
    return true;
  }

  return !env.workerExecutionRequestPayloadDisabledWorkerIds.includes(workerId);
}

function getWorkerRequestPayloadSizeBytes(payload: Record<string, any>) {
  try {
    return Buffer.byteLength(JSON.stringify(payload) ?? '', 'utf8');
  } catch {
    return 0;
  }
}

function redactWorkerLogString(value: string, secretValues: string[]) {
  return secretValues.reduce(
    (redacted, secret) => redacted.replaceAll(secret, '[secret]'),
    value
  );
}

function redactWorkerLogValue(value: any, secretValues: string[]): any {
  if (typeof value === 'string') {
    return redactWorkerLogString(value, secretValues);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactWorkerLogValue(item, secretValues));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        redactWorkerLogString(key, secretValues),
        redactWorkerLogValue(item, secretValues),
      ])
    );
  }

  return value;
}

export const { get: getWorker, del: delWorkerCache } = buildQueryWithCache(
  'worker',
  async (workerId: string, workspaceId: string) => {
    const worker = await prisma.functionWorker.findUnique({
      where: {
        id: workerId,
        workspaceId,
      },
    });

    return worker;
  }
);

/**
 * execute a worker code in isolated-vm
 */
export async function execWorker(
  code: string,
  workerId?: string,
  requestPayload?: Record<string, any>,
  context?: Record<string, any>,
  environment: Record<string, string> = {},
  secretValues: string[] = []
) {
  const workerRequestPayload: Record<string, any> = isPlainObject(requestPayload)
    ? (requestPayload as Record<string, any>)
    : {};
  const workerContext = {
    ...(isPlainObject(context) ? context : {}),
    env: isPlainObject(environment) ? environment : {},
  };
  const shouldStoreRequestPayload = shouldStoreWorkerRequestPayload(workerId);
  const requestPayloadSizeBytes =
    getWorkerRequestPayloadSizeBytes(workerRequestPayload);
  const secretsToRedact = [...new Set(secretValues.filter(Boolean))].sort(
    (left, right) => right.length - left.length
  );

  try {
    const {
      logger: logs,
      result,
      error,
      usage,
      cpuTime,
      memoryUsage,
    } = await runCodeInIVM(`
      (async () => {
        ${code}

        return typeof fetch === 'function' ? fetch(__requestPayload, __workerContext) : 'fetch is not defined';
      })()
    `, {
      __requestPayload: workerRequestPayload,
      __workerContext: workerContext,
    });

    const { used_heap_size } = memoryUsage;

    const payload = {
      id: workerId ? createId() : undefined,
      workerId: workerId || '',
      status: error
        ? FunctionWorkerExecutionStatus.Failed
        : FunctionWorkerExecutionStatus.Success,
      duration: usage,
      memoryUsed: used_heap_size,
      cpuTime,
      requestPayload: shouldStoreRequestPayload ? requestPayload : null,
      responsePayload: result,
      error: error ? String(error) : undefined,
      logs: Array.isArray(logs)
        ? logs.map((log) =>
            log.map(
              (item) => redactWorkerLogValue(item ?? null, secretsToRedact)
            )
          )
        : [],
    };

    // Record Prometheus metrics
    const workerIdLabel = workerId || 'anonymous';
    const statusLabel = error ? 'Failed' : 'Success';

    promWorkerExecutionCounter.labels(workerIdLabel, statusLabel).inc();
    promWorkerExecutionDuration
      .labels(workerIdLabel, statusLabel)
      .observe(usage / 1000); // ms to seconds
    promWorkerCPUTime.labels(workerIdLabel, statusLabel).observe(cpuTime);
    promWorkerMemoryUsage
      .labels(workerIdLabel, statusLabel)
      .observe(used_heap_size);
    promWorkerRequestPayloadSize
      .labels(workerIdLabel, statusLabel)
      .observe(requestPayloadSizeBytes);

    if (workerId) {
      execRecordWriter.enqueue({
        ...payload,
        requestPayload: shouldStoreRequestPayload
          ? payload.requestPayload
          : Prisma.DbNull,
      });
    }

    return payload;
  } catch (e) {
    logger.error('ExecWorker error:', e);

    // Record Prometheus metrics for failure
    const workerIdLabel = workerId || 'anonymous';

    promWorkerExecutionCounter.labels(workerIdLabel, 'Failed').inc();
    promWorkerRequestPayloadSize
      .labels(workerIdLabel, 'Failed')
      .observe(requestPayloadSizeBytes);

    const payload = {
      workerId: workerId || '',
      status: FunctionWorkerExecutionStatus.Failed,
      requestPayload: shouldStoreRequestPayload ? requestPayload : null,
      error: String(e),
      logs: [],
      responsePayload: null,
    };

    if (workerId) {
      execRecordWriter.enqueue({
        ...payload,
        requestPayload: shouldStoreRequestPayload
          ? payload.requestPayload
          : Prisma.DbNull,
      });
    }

    return payload;
  }
}

export async function execStoredWorker(
  worker: { id: string; code: string },
  requestPayload?: Record<string, any>,
  context?: Record<string, any>
) {
  const { environment, secretValues } =
    await loadWorkerEnvironmentForExecution(worker.id);

  return execWorker(
    worker.code,
    worker.id,
    requestPayload,
    context,
    environment,
    secretValues
  );
}
