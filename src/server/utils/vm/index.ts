import ivm from 'isolated-vm';
import { buildSandbox, environmentScript } from './sandbox.js';
import { env } from '../env.js';
import { runCodeInVM2 } from './sandbox-vm2.js';
import { logger } from '../logger.js';

if (env.sandbox.useVM2) {
  logger.warn(
    '[Monitor] Using VM2 for code execution, which this is not recommended for production use.'
  );
}

export async function runCodeInVM(_code: string): Promise<{
  logger: any[][];
  result: any;
  usage: number;
}> {
  const code = `;(async () => {${_code}})();`;

  try {
    // Try to use VM2 first if enabled via environment variable
    if (env.sandbox.useVM2) {
      try {
        const ret = await runCodeInVM2(code);
        return ret;
      } catch (err) {
        console.error(
          '[Monitor] VM2 execution failed, falling back to isolated-vm:',
          err
        );
        throw err;
      }
    } else {
      // Use isolated-vm
      try {
        const ret = await runCodeInIVM(code);
        return ret;
      } catch (err) {
        console.error('[Monitor] isolated-vm execution failed:', err);
        throw err;
      }
    }
  } catch (err) {
    console.error('[Monitor] Code execution failed:', err);
    throw err;
  }
}

async function runCodeInIVM(_code: string) {
  const start = Date.now();
  const isolate = new ivm.Isolate({ memoryLimit: env.sandbox.memoryLimit });

  // avoid end comment with line break
  const code = `${environmentScript}

${_code}`;

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
