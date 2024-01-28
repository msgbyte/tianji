import { Request } from 'express';
import type { WebsiteEventPayload } from '../model/website';
import { getClientIp } from 'request-ip';
import isLocalhost from 'is-localhost-ip';
import { safeDecodeURIComponent } from './common';
import { browserName, detectOS, OperatingSystem } from 'detect-browser';
import {
  DESKTOP_OS,
  DESKTOP_SCREEN_WIDTH,
  LAPTOP_SCREEN_WIDTH,
  MOBILE_OS,
  MOBILE_SCREEN_WIDTH,
} from './const';
import maxmind, { Reader, CityResponse } from 'maxmind';
import { libraryPath } from './lib';

let lookup: Reader<CityResponse>;

export async function getRequestInfo(req: Request) {
  const userAgent = req.headers['user-agent'];
  const ip = getIpAddress(req);
  const location = await getLocation(ip, req);
  const country = location?.country;
  const subdivision1 = location?.subdivision1;
  const subdivision2 = location?.subdivision2;
  const city = location?.city;
  const browser = browserName(userAgent ?? '');
  const os = detectOS(userAgent ?? '');

  return {
    userAgent,
    browser,
    os,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
  };
}

export async function getClientInfo(
  req: Request,
  payload: WebsiteEventPayload
) {
  const requestInfo = await getRequestInfo(req);
  const device = getDevice(payload.screen, requestInfo.os);

  return {
    ...requestInfo,
    device,
  };
}

export function getIpAddress(req: Request): string {
  // Custom header
  if (
    process.env.CLIENT_IP_HEADER &&
    req.headers[process.env.CLIENT_IP_HEADER]
  ) {
    return String(req.headers[process.env.CLIENT_IP_HEADER]);
  }
  // Cloudflare
  else if (req.headers['cf-connecting-ip']) {
    return String(req.headers['cf-connecting-ip']);
  }

  return getClientIp(req)!;
}

export async function getLocation(ip: string, req: Request) {
  // Ignore local ips
  if (await isLocalhost(ip)) {
    return;
  }

  // Cloudflare headers
  if (req.headers['cf-ipcountry']) {
    const country = safeDecodeURIComponent(req.headers['cf-ipcountry']);
    const subdivision1 = safeDecodeURIComponent(req.headers['cf-region-code']);
    const city = safeDecodeURIComponent(req.headers['cf-ipcity']);

    return {
      country,
      subdivision1: getRegionCode(country, subdivision1),
      city,
    };
  }

  // Vercel headers
  if (req.headers['x-vercel-ip-country']) {
    const country = safeDecodeURIComponent(req.headers['x-vercel-ip-country']);
    const subdivision1 = safeDecodeURIComponent(
      req.headers['x-vercel-ip-country-region']
    );
    const city = safeDecodeURIComponent(req.headers['x-vercel-ip-city']);

    return {
      country,
      subdivision1: getRegionCode(country, subdivision1),
      city,
    };
  }

  // Database lookup
  if (!lookup) {
    lookup = await maxmind.open(libraryPath.geoPath);
  }

  const result = lookup.get(ip);

  if (result) {
    return {
      country: result.country?.iso_code ?? result?.registered_country?.iso_code,
      subdivision1: result.subdivisions?.[0]?.iso_code,
      subdivision2: result.subdivisions?.[1]?.names?.en,
      city: result.city?.names?.en,
    };
  }
}

function getRegionCode(
  country: string | null | undefined,
  region: string | null | undefined
) {
  if (!country || !region) {
    return undefined;
  }

  return region.includes('-') ? region : `${country}-${region}`;
}

export function getDevice(
  screen: string | undefined,
  os: OperatingSystem | null
) {
  if (!screen) return;
  if (!os) return;

  const [width] = screen.split('x').map((n) => Number(n));

  if (DESKTOP_OS.includes(os)) {
    if (os === 'Chrome OS' || width < DESKTOP_SCREEN_WIDTH) {
      return 'laptop';
    }
    return 'desktop';
  } else if (MOBILE_OS.includes(os)) {
    if (os === 'Amazon OS' || width > MOBILE_SCREEN_WIDTH) {
      return 'tablet';
    }
    return 'mobile';
  }

  if (width >= DESKTOP_SCREEN_WIDTH) {
    return 'desktop';
  } else if (width >= LAPTOP_SCREEN_WIDTH) {
    return 'laptop';
  } else if (width >= MOBILE_SCREEN_WIDTH) {
    return 'tablet';
  } else {
    return 'mobile';
  }
}
