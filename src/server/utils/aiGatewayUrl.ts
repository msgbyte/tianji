import type { LookupAddress } from 'node:dns';
import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import ipaddr from 'ipaddr.js';
import OpenAI from 'openai';
import { Agent } from 'undici';
import { env } from './env.js';

const publicAddressRequired =
  'Custom model base URL must resolve to a public IP address.';
const globalIPv6 = ipaddr.IPv6.parseCIDR('2000::/3');
// Azure's platform address and AWS's IPv6 metadata/service endpoint range (e.g. EC2 IMDSv6, EKS Pod Identity).
const azurePlatformIPv4 = ipaddr.IPv4.parseCIDR('168.63.129.16/32');
const awsInternalIPv6 = ipaddr.IPv6.parseCIDR('fd00:ec2::/32');

function checkAddress(address: string) {
  const ip = ipaddr.parse(address);
  const range = ip.range();
  if (
    (ip instanceof ipaddr.IPv4 && ip.match(azurePlatformIPv4)) ||
    (ip instanceof ipaddr.IPv6 && ip.match(awsInternalIPv6))
  ) {
    throw new Error(publicAddressRequired);
  }
  if (
    env.aiGatewayAllowPrivateUrl &&
    (range === 'private' || range === 'loopback' || range === 'uniqueLocal')
  ) {
    return;
  }
  if (
    range !== 'unicast' ||
    (ip instanceof ipaddr.IPv6 && !ip.match(globalIPv6))
  ) {
    throw new Error(publicAddressRequired);
  }
}

export function parseAIGatewayUrl(value: string): URL {
  const url = new URL(value);
  if (
    !/^https?:\/\//i.test(value.trim()) ||
    !['https:', 'http:'].includes(url.protocol)
  ) {
    throw new Error('Upstream URL must use HTTP or HTTPS.');
  }
  if (url.username || url.password) {
    throw new Error('Custom model base URL must not contain credentials.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname)) {
    checkAddress(hostname);
  } else if (
    !env.aiGatewayAllowPrivateUrl &&
    /(^|\.)localhost\.?$/i.test(hostname)
  ) {
    throw new Error(publicAddressRequired);
  }
  return url;
}

async function resolveAddresses(hostname: string) {
  let addresses: LookupAddress[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (cause) {
    throw new Error(publicAddressRequired, { cause });
  }
  if (!addresses.length) {
    throw new Error(publicAddressRequired);
  }
  for (const { address } of addresses) checkAddress(address);
  return addresses;
}

export async function validateAIGatewayUrl(value: string) {
  const { hostname } = parseAIGatewayUrl(value);
  if (!isIP(hostname.replace(/^\[|\]$/g, ''))) await resolveAddresses(hostname);
}

// Supply the checked addresses directly to the connecting socket, preserving the TLS hostname.
export const lookupAIGatewayAddress: LookupFunction = (
  host,
  options,
  callback
) => {
  resolveAddresses(host).then(
    (addresses) => {
      const rawFamily =
        typeof options === 'number' ? options : options?.family;
      const family =
        rawFamily === 'IPv6' ? 6 : rawFamily === 'IPv4' ? 4 : rawFamily;
      const all =
        typeof options === 'object' && options !== null && Boolean(options.all);
      const candidates = family
        ? addresses.filter((entry) => entry.family === family)
        : addresses;
      if (!candidates.length) {
        callback(
          new Error(
            'No matching address family for the custom model base URL.'
          ),
          ''
        );
      } else if (all) {
        callback(null, candidates);
      } else {
        callback(null, candidates[0].address, candidates[0].family);
      }
    },
    (error: Error) => callback(error, '')
  );
};

const dispatcher = new Agent({ connect: { lookup: lookupAIGatewayAddress } });

export const fetchAIGatewayUrl: typeof fetch = async (input, init) => {
  parseAIGatewayUrl(input instanceof Request ? input.url : input.toString());
  const options = { ...init, dispatcher, redirect: 'error' as const };
  return fetch(input, options);
};

// The OpenAI v4 SDK uses node-fetch and consumes Node response streams.
const httpAgent = new http.Agent({
  keepAlive: true,
  lookup: lookupAIGatewayAddress,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
  lookup: lookupAIGatewayAddress,
});

export class CustomGatewayOpenAI extends OpenAI {
  protected override async prepareRequest(
    request: object,
    { url }: { url: string }
  ) {
    const target = parseAIGatewayUrl(url);
    Object.assign(request, {
      agent: target.protocol === 'https:' ? httpsAgent : httpAgent,
      redirect: 'error',
    });
  }
}
