import { MonitorProvider } from './type';
import pingUtils from 'ping';

export const ping: MonitorProvider = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { hostname } = monitor.payload as any;

    const res = await pingAction(hostname);

    if (res === 'unknown') {
      return -1;
    }

    return res;
  },
};

const isWindows = /^win/.test(process.platform);

function pingAction(hostname: string, packetSize = 56) {
  return new Promise<number | 'unknown'>((resolve, reject) => {
    pingUtils.promise
      .probe(hostname, {
        min_reply: 1,
        deadline: 10,
        packetSize,
      })
      .then((res) => {
        // If ping failed, it will set field to unknown
        if (res.alive) {
          resolve(res.time);
        } else {
          if (isWindows) {
            reject(new Error(exports.convertToUTF8(res.output)));
          } else {
            reject(new Error(res.output));
          }
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}
