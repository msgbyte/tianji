import { MonitorProvider } from './type.js';
import { runCodeInVM } from '../../../utils/vm/index.js';

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
