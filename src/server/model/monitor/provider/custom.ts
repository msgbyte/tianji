import { MonitorProvider } from './type';
import ivm from 'isolated-vm';
import { buildSandbox, environmentScript } from '../../../utils/sandbox';
import { env } from '../../../utils/env';

export const custom: MonitorProvider<{
  code: string;
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { code } = monitor.payload;

    const { result } = await runCodeInVM(code);

    if (typeof result !== 'number') {
      return -1;
    }

    return result;
  },
};

export async function runCodeInVM(_code: string) {
  const start = Date.now();
  const isolate = new ivm.Isolate({ memoryLimit: env.sandboxMemoryLimit });

  const code = `${environmentScript}\n\n;(async () => {${_code}})()`;

  const [context, script] = await Promise.all([
    isolate.createContext(),
    isolate.compileScript(code),
  ]);

  const logger: any[][] = [];

  buildSandbox(context, {
    console: {
      log: (...args: any[]) => {
        logger.push(['log', Date.now(), ...args]);
      },
      warn: (...args: any[]) => {
        logger.push(['warn', Date.now(), ...args]);
      },
      error: (...args: any[]) => {
        logger.push(['error', Date.now(), ...args]);
      },
    },
  });

  const res = await script.run(context, {
    promise: true,
  });

  context.release();
  script.release();

  return { logger, result: res, usage: Date.now() - start };
}
