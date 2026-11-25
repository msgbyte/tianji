import type { LookupAddress } from 'node:dns';
import dns from 'node:dns/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, expect, test, vi } from 'vitest';
import { testAIGatewayCustomConnection } from '../model/aiGateway/connectivity.js';
import { env } from './env.js';
import {
  CustomGatewayOpenAI,
  fetchAIGatewayUrl,
  lookupAIGatewayAddress,
  validateAIGatewayUrl,
} from './aiGatewayUrl.js';

vi.hoisted(() => vi.stubEnv('AI_GATEWAY_ALLOW_PRIVATE_URL', undefined));

const resolver: {
  lookup(host: string, options: { all: true }): Promise<LookupAddress[]>;
} = dns;
const publicAddress = { address: '1.1.1.1', family: 4 };
const loopback = { address: '127.0.0.1', family: 4 };

afterEach(() => vi.restoreAllMocks());

test.each([
  'invalid',
  '/relative',
  'https:example.com',
  'file:///etc/hosts',
  'ftp://provider.invalid',
  'gopher://provider.invalid',
  'ws://provider.invalid',
  'https://user:password@provider.invalid',
])('rejects invalid or unsupported custom model URL %s', async (url) => {
  const lookup = vi.spyOn(resolver, 'lookup');
  await expect(validateAIGatewayUrl(url)).rejects.toThrow();
  expect(lookup).not.toHaveBeenCalled();
});

test.each([
  'localhost',
  'LOCALHOST.',
  'model.localhost',
  'model.localhost.',
  '127.0.0.2',
  '127.1',
  '2130706433',
  '10.2.3.4',
  '172.31.255.255',
  '192.168.1.1',
  '169.254.169.254',
  '100.100.100.200',
  '224.0.0.1',
  '0.0.0.0',
  '0.1.2.3',
  '255.255.255.255',
  '168.63.129.16',
  '[::]',
  '[::1]',
  '[fc00::1]',
  '[fd00:ec2::23]',
  '[fd00:ec2::254]',
  '[fe80::1234]',
  '[ff02::1]',
  '[::ffff:127.0.0.1]',
  '[::ffff:169.254.169.254]',
  '[::ffff:1.1.1.1]',
  '[64:ff9b::1]',
  '[2002:7f00:1::]',
])('rejects non-public host %s by default', async (host) => {
  expect(env.aiGatewayAllowPrivateUrl).toBe(false);
  await expect(validateAIGatewayUrl(`http://${host}/v1`)).rejects.toThrow(
    'public IP'
  );
});

test('accepts HTTP and HTTPS for public IPv4, IPv6 and DNS names', async () => {
  const lookup = vi
    .spyOn(resolver, 'lookup')
    .mockResolvedValue([publicAddress]);
  for (const url of [
    'https://1.1.1.1',
    'http://[2606:4700:4700::1111]/v1',
    'https://provider.invalid:8443/v1',
  ]) {
    await expect(validateAIGatewayUrl(url)).resolves.toBeUndefined();
  }
  expect(lookup.mock.calls).toEqual([['provider.invalid', { all: true }]]);
});

test.each([
  { addresses: [loopback] },
  { addresses: [publicAddress, loopback] },
  { addresses: [publicAddress, { family: 6, address: '::ffff:127.0.0.1' }] },
  { addresses: [] },
])('rejects an unsafe or empty DNS answer', async ({ addresses }) => {
  vi.spyOn(resolver, 'lookup').mockResolvedValue(addresses);
  await expect(
    validateAIGatewayUrl('https://provider.invalid')
  ).rejects.toThrow();
});

test('hands only the checked DNS answers to the socket, respecting its requested family', async () => {
  const ipv6 = { family: 6, address: '2606:4700:4700::1111' };
  const lookup = vi
    .spyOn(resolver, 'lookup')
    .mockResolvedValue([publicAddress, ipv6]);
  const connect = (all: boolean, family?: number) =>
    new Promise((resolve, reject) =>
      lookupAIGatewayAddress(
        'provider.invalid',
        { all, family },
        (error, address, family) =>
          error ? reject(error) : resolve([address, family])
      )
    );
  expect(await connect(true)).toEqual([[publicAddress, ipv6], undefined]);
  expect(await connect(false, 6)).toEqual([ipv6.address, 6]);
  expect(lookup).toHaveBeenCalledTimes(2);
});

test('handles missing lookup options safely', async () => {
  vi.spyOn(resolver, 'lookup').mockResolvedValue([publicAddress]);
  const result = await new Promise((resolve, reject) =>
    lookupAIGatewayAddress(
      'provider.invalid',
      undefined as any,
      (error, address, family) =>
        error ? reject(error) : resolve([address, family])
    )
  );
  expect(result).toEqual([publicAddress.address, 4]);
});

test('normalizes DNS lookup failures into the public-IP error without leaking internal hostnames', async () => {
  vi.spyOn(resolver, 'lookup').mockRejectedValue(
    new Error('getaddrinfo ENOTFOUND internal.svc.cluster.local')
  );
  await expect(
    validateAIGatewayUrl('https://internal.svc.cluster.local')
  ).rejects.toThrow('Custom model base URL must resolve to a public IP address.');
});

const transports = [
  { name: 'native fetch', send: (url: string) => fetchAIGatewayUrl(url) },
  {
    name: 'OpenAI SDK',
    send: (url: string) =>
      new CustomGatewayOpenAI({
        baseURL: url,
        apiKey: 'test',
        maxRetries: 0,
      }).models.list(),
  },
];

test.each(transports)(
  '$name rejects a DNS change between input validation and connection',
  async ({ send }) => {
    const lookup = vi
      .spyOn(resolver, 'lookup')
      .mockResolvedValueOnce([publicAddress])
      .mockResolvedValue([loopback]);
    const url = 'http://changed.provider.invalid';
    await validateAIGatewayUrl(url);
    await expect(send(url)).rejects.toMatchObject({
      cause: { message: expect.stringContaining('public IP') },
    });
    expect(lookup).toHaveBeenCalledTimes(2);
  }
);

test.each(transports)(
  '$name never follows a redirect to a loopback destination',
  async ({ send }) => {
    vi.spyOn(env, 'aiGatewayAllowPrivateUrl', 'get').mockReturnValue(true);
    const paths: string[] = [];
    const server = createServer((req, res) => {
      paths.push(req.url!);
      if (req.url === '/private') res.end('{}');
      else res.writeHead(302, { location: '/private' }).end();
    });
    server.listen(0, '127.0.0.1');
    try {
      await once(server, 'listening');
      const port = (server.address() as AddressInfo).port;
      await expect(send(`http://127.0.0.1:${port}`)).rejects.toThrow();
      expect(paths).toHaveLength(1);
      expect(paths).not.toContain('/private');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
);

test('the production connectivity probe rejects a previously stored loopback URL', async () => {
  await expect(
    testAIGatewayCustomConnection({
      customModelBaseUrl: 'http://127.0.0.1',
      customModelName: null,
      modelApiKey: 'test',
    })
  ).rejects.toThrow('public IP');
});

test('private-network opt-in admits local model servers and still blocks metadata and mapped addresses', async () => {
  vi.stubEnv('AI_GATEWAY_ALLOW_PRIVATE_URL', 'true');
  vi.resetModules();
  try {
    const { validateAIGatewayUrl } = await import('./aiGatewayUrl.js');
    vi.spyOn(resolver, 'lookup').mockResolvedValue([loopback]);
    for (const host of ['localhost', '127.0.0.1', '192.168.0.1', '[fd12::1]']) {
      await expect(
        validateAIGatewayUrl(`http://${host}:11434`)
      ).resolves.toBeUndefined();
    }
    for (const host of [
      '169.254.169.254',
      '[fd00:ec2::23]',
      '[fd00:ec2::254]',
      '[::ffff:127.0.0.1]',
    ]) {
      await expect(validateAIGatewayUrl(`http://${host}`)).rejects.toThrow(
        'public IP'
      );
    }
    vi.spyOn(resolver, 'lookup').mockResolvedValue([
      { address: 'fd00:ec2::254%eth0', family: 6 },
    ]);
    await expect(
      validateAIGatewayUrl('http://metadata.internal')
    ).rejects.toThrow('public IP');
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
