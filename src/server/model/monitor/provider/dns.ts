import { MonitorProvider } from './type';
import { Resolver } from 'dns';

export const dns: MonitorProvider<{
  hostname: string;
  resolverServer: string;
  resolverPort: number;
  rrtype: string;
}> = {
  run: async (monitor) => {
    if (typeof monitor.payload !== 'object') {
      throw new Error('monitor.payload should be object');
    }

    const { hostname, resolverServer, resolverPort, rrtype } = monitor.payload;

    const res = await dnsResolve(
      hostname,
      resolverServer,
      resolverPort,
      rrtype
    );

    return res;
  },
};

function dnsResolve(
  hostname: string,
  resolverServer: string,
  resolverPort: number,
  rrtype: string
) {
  const start = Date.now();
  return new Promise<number>((resolve, reject) => {
    const resolver = new Resolver();
    // Remove brackets from IPv6 addresses so we can re-add them to
    // prevent issues with ::1:5300 (::1 port 5300)
    resolverServer = resolverServer.replace('[', '').replace(']', '');
    resolver.setServers([`[${resolverServer}]:${resolverPort}`]);

    if (rrtype === 'PTR') {
      resolver.reverse(hostname, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(Date.now() - start);
        }
      });
    } else {
      resolver.resolve(hostname, rrtype, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(Date.now() - start);
        }
      });
    }
  });
}
