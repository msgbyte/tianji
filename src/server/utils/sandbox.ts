import axios, { AxiosRequestConfig } from 'axios';
import EventEmitter from 'events';
import ivm, { Context } from 'isolated-vm';

function isTransferable(data: any): data is ivm.Transferable {
  const dataType = typeof data;

  if (data === ivm) {
    return true;
  }

  if (
    ['null', 'undefined', 'string', 'number', 'boolean', 'function'].includes(
      dataType
    )
  ) {
    return true;
  }

  if (dataType !== 'object') {
    return false;
  }

  return (
    data instanceof ivm.Isolate ||
    data instanceof ivm.Context ||
    data instanceof ivm.Script ||
    data instanceof ivm.ExternalCopy ||
    data instanceof ivm.Callback ||
    data instanceof ivm.Reference
  );
}

function proxyObject(
  obj: Record<string, any>,
  forbiddenKeys: string[] = []
): Record<string, any> {
  return copyObject({
    isProxy: true,
    get: (key: string) => {
      if (forbiddenKeys.includes(key)) {
        return undefined;
      }

      const value = obj[key];

      if (typeof value === 'function') {
        return new ivm.Reference(async (...args: any[]) => {
          const result = (obj[key] as any)(...args);

          if (result && result instanceof Promise) {
            return new Promise(async (resolve, reject) => {
              try {
                const awaitedResult = await result;
                resolve(makeTransferable(awaitedResult));
              } catch (e) {
                reject(e);
              }
            });
          }

          return makeTransferable(result);
        });
      }

      return makeTransferable(value);
    },
  });
}

// Semi-transferable data can be copied with an ivm.ExternalCopy without needing any manipulation.
function isSemiTransferable(data: any) {
  return data instanceof ArrayBuffer;
}

export function copyObject(
  obj: Record<string, any> | any[]
): Record<string, any> | any[] {
  if (Array.isArray(obj)) {
    return obj.map((data) => copyData(data));
  }

  if (obj instanceof Response) {
    return proxyObject(obj, ['clone']);
  }

  if (isSemiTransferable(obj)) {
    return obj;
  }

  if (typeof obj[Symbol.iterator as any] === 'function') {
    return copyObject(Array.from(obj as any));
  }

  if (obj instanceof EventEmitter) {
    return {};
  }

  const keys = Object.keys(obj);

  return {
    ...Object.fromEntries(
      keys.map((key) => {
        const data = obj[key];

        if (typeof data === 'function') {
          return [key, new ivm.Callback((...args: any[]) => obj[key](...args))];
        }

        return [key, copyData(data)];
      })
    ),
  };
}

function copyData<T extends ivm.Transferable | Record<string, any> | any[]>(
  data: T
) {
  return isTransferable(data) ? data : copyObject(data);
}

function makeTransferable(data: any) {
  return isTransferable(data)
    ? data
    : new ivm.ExternalCopy(copyObject(data)).copyInto();
}

export function buildSandbox(context: Context) {
  const jail = context.global;
  jail.setSync('global', jail.derefInto());
  jail.setSync('ivm', ivm);
  jail.setSync('console', makeTransferable(console));
  jail.setSync(
    '_request',
    new ivm.Reference(async (config: AxiosRequestConfig) => {
      const result = await axios.request(config);

      return makeTransferable({
        data: result.data,
        status: result.status,
      });
    })
  );
}

export const environmentScript = `
const reproxy = (reference) => {
  return new Proxy(reference, {
    get(target, p, receiver) {
      if (target !== reference || p === 'then') {
        return Reflect.get(target, p, receiver);
      }

      const data = reference.get(p);

      if (typeof data === 'object' && data instanceof ivm.Reference && data.typeof === 'function') {
        return (...args) => data.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });
      }

      return data;
    }
  });
};

const request = async (...args) => {
  const result = await _request.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });

  if (result && typeof result === 'object' && result.isProxy) {
    return reproxy(result);
  }

  return result;
};
`;
