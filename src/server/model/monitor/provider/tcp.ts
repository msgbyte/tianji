import { MonitorProvider } from './type.js';
import tcpp from 'tcp-ping';

export const tcp: MonitorProvider<{
  hostname: string;
  port: number;
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { hostname, port } = monitor.payload;

    const res = await pingAction(hostname, port);

    return res;
  },
};

function pingAction(hostname: string, port: number) {
  return new Promise<number>((resolve, reject) => {
    tcpp.ping(
      {
        address: hostname,
        port,
        attempts: 1,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (result.results.length >= 1 && result.results[0].err) {
            reject(result.results[0].err);
          }

          resolve(Math.round(result.max));
        }
      }
    );
  });
}
