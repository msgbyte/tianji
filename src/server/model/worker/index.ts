import { FunctionWorkerExecutionStatus } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { prisma } from '../_client.js';
import { isPlainObject } from 'lodash-es';

/**
 * execute a worker code in isolated-vm
 */
export async function execWorker(
  workerId: string,
  requestPayload?: Record<string, any>
) {
  const worker = await prisma.functionWorker.findUnique({
    where: {
      id: workerId,
    },
  });

  if (!worker) {
    throw new Error('Worker not found');
  }

  if (!worker.active) {
    throw new Error('Worker is not active');
  }

  const code = worker.code;

  const requestPayloadString = isPlainObject(requestPayload)
    ? JSON.stringify(requestPayload)
    : '';

  try {
    const { isolate, logger, result, usage } = await runCodeInIVM(`
      (async () => {
        ${code}

        return typeof fetch === 'function' ? fetch(${requestPayloadString}) : 'fetch is not defined';
      })()
    `);

    const cpuTime = Number(isolate.cpuTime); // unit: ns
    const memoryUsage = await isolate.getHeapStatistics(); // unit: bytes

    const { used_heap_size } = memoryUsage;

    const res = await prisma.functionWorkerExecution.create({
      data: {
        workerId,
        status: FunctionWorkerExecutionStatus.Success,
        duration: usage,
        memoryUsed: used_heap_size,
        cpuTime,
        requestPayload,
        responsePayload: result,
        logs: Array.isArray(logger)
          ? logger.map((log) => JSON.stringify(log.join(' ')))
          : [],
      },
    });

    return res;
  } catch (e) {
    const res = await prisma.functionWorkerExecution.create({
      data: {
        workerId,
        status: FunctionWorkerExecutionStatus.Failed,
        requestPayload,
        error: String(e),
        logs: [], // TODO: add logs for error worker
      },
    });

    return res;
  }
}
