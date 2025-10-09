import { FunctionWorkerExecutionStatus } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { prisma } from '../_client.js';
import { isPlainObject } from 'lodash-es';

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
    const { isolate, logger, result, usage } = await runCodeInIVM(`
      (async () => {
        ${code}

        return typeof fetch === 'function' ? fetch(${requestPayloadString}, ${contextString}) : 'fetch is not defined';
      })()
    `);

    const cpuTime = Number(isolate.cpuTime); // unit: ns
    const memoryUsage = await isolate.getHeapStatistics(); // unit: bytes

    const { used_heap_size } = memoryUsage;

    const payload = {
      workerId: workerId || '',
      status: FunctionWorkerExecutionStatus.Success,
      duration: usage,
      memoryUsed: used_heap_size,
      cpuTime,
      requestPayload,
      responsePayload: result,
      logs: Array.isArray(logger) ? logger : [],
    };

    if (workerId) {
      const res = await prisma.functionWorkerExecution.create({
        data: payload,
      });

      return res;
    }

    return payload;
  } catch (e) {
    const payload = {
      workerId: workerId || '',
      status: FunctionWorkerExecutionStatus.Failed,
      requestPayload,
      error: String(e),
      logs: [], // TODO: add logs for error worker
      responsePayload: null,
    };

    if (workerId) {
      const res = await prisma.functionWorkerExecution.create({
        data: payload,
      });

      return res;
    }

    return payload;
  }
}
