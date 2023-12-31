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

    const res = await runCodeInVM(code);

    if (typeof res !== 'number') {
      return -1;
    }

    return res;
  },
};

async function runCodeInVM(_code: string) {
  const isolate = new ivm.Isolate({ memoryLimit: env.sandboxMemoryLimit });

  const code = `${environmentScript}\n\n;(async () => {${_code}})()`;

  const [context, script] = await Promise.all([
    isolate.createContext(),
    isolate.compileScript(code),
  ]);

  buildSandbox(context);

  const res = await script.run(context, {
    promise: true,
  });

  context.release();
  script.release();

  return res;
}
