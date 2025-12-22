import { FunctionWorkerExecutionStatus } from '@prisma/client';
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
} from '../../utils/prometheus/client.js';
import { createId } from '@paralleldrive/cuid2';

export const { get: getWorker, del: delWorkerCache } = buildQueryWithCache(
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
  context?: Record<string, any>
) {
  const requestPayloadString = isPlainObject(requestPayload)
    ? JSON.stringify(requestPayload)
    : '{}';
  const contextString = isPlainObject(context) ? JSON.stringify(context) : '{}';

  try {
    const {
      isolate,
      logger: logs,
      result,
      error,
      usage,
    } = await runCodeInIVM(`
      (async () => {
        ${code}

        return typeof fetch === 'function' ? fetch(${requestPayloadString}, ${contextString}) : 'fetch is not defined';
      })()
    `);

    const cpuTime = Number(isolate.cpuTime); // unit: ns
    const memoryUsage = await isolate.getHeapStatistics(); // unit: bytes

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
      requestPayload,
      responsePayload: result,
      error: error ? String(error) : undefined,
      logs: Array.isArray(logs)
        ? logs.map((log) => log.map((item) => item ?? null)) // make sure log item is not undefined
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

    if (workerId) {
      // Async save execution record without blocking response
      prisma.functionWorkerExecution.create({ data: payload }).catch((err) => {
        logger.error('Failed to save worker execution record:', err); // TODO: need to confirm its will not have too much error
      });
    }

    return payload;
  } catch (e) {
    logger.error('ExecWorker error:', e);

    // Record Prometheus metrics for failure
    const workerIdLabel = workerId || 'anonymous';

    promWorkerExecutionCounter.labels(workerIdLabel, 'Failed').inc();

    const payload = {
      workerId: workerId || '',
      status: FunctionWorkerExecutionStatus.Failed,
      requestPayload,
      error: String(e),
      logs: [], // TODO: add logs for error worker
      responsePayload: null,
    };

    if (workerId) {
      // Sync save execution record if failed to run
      const res = await prisma.functionWorkerExecution.create({
        data: payload,
      });

      return res;
    }

    return payload;
  }
}
