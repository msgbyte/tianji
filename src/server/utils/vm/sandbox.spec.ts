import { describe, test, expect } from 'vitest';
import ivm from 'isolated-vm';

describe('isolated-vm', () => {
  test('simple module', async () => {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();

    const source = `
    export default {
      fetch() {
        return 1
      }
    };
  `;

    const module = await isolate.compileModule(source);
    await module.instantiate(context, (_, referrer) => {
      return referrer;
    });
    await module.evaluate();

    const ns = module.namespace;

    const defaultExport = await ns.get('default', {
      // copy: true,
      reference: true,
    });
    const fetchRef = await defaultExport.get('fetch', { reference: true });

    const result = await fetchRef.apply(undefined, []);

    expect(result).toBe(1);
  });
});
