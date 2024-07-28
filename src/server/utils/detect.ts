import { Request } from 'express';
import type { WebsiteEventPayload } from '../model/website.js';
import { getClientIp } from 'request-ip';
import isLocalhost from 'is-localhost-ip';
import { browserName, detectOS, OperatingSystem } from 'detect-browser';
import {
  DESKTOP_OS,
  DESKTOP_SCREEN_WIDTH,
  LAPTOP_SCREEN_WIDTH,
  MOBILE_OS,
  MOBILE_SCREEN_WIDTH,
} from './const.js';
import maxmind, { Reader, CityResponse } from 'maxmind';
import { libraryPath } from './lib.js';
import { IncomingMessage } from 'http';
import { parse as pareseAcceptLanguage } from 'accept-language-parser';

export async function getRequestInfo(req: IncomingMessage) {
  const userAgent = req.headers['user-agent'];
  const ip = getIpAddress(req);
  const location = await getLocation(ip);
  const {
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
  } = location ?? {};
  const browser = browserName(userAgent ?? '');
  const os = detectOS(userAgent ?? '');
  const language: string | undefined =
    pareseAcceptLanguage(req.headers['accept-language'])[0]?.code ?? undefined;

  return {
    userAgent,
    browser,
    os,
    language,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
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

export function getIpAddress(req: IncomingMessage): string {
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

let lookup: Reader<CityResponse>;
export async function getLocation(ip: string) {
  // Ignore local ips
  if (await isLocalhost(ip)) {
    return;
  }

  // Database lookup
  if (!lookup) {
    lookup = await maxmind.open(libraryPath.geoPath);
  }

  const result = lookup.get(ip);

  if (!result) {
    return;
  }

  return {
    country: result.country?.iso_code ?? result?.registered_country?.iso_code,
    subdivision1: result.subdivisions?.[0]?.iso_code,
    subdivision2: result.subdivisions?.[1]?.names?.en,
    city: result.city?.names?.en,
    longitude: result.location?.longitude,
    latitude: result.location?.latitude,
    accuracyRadius: result.location?.accuracy_radius,
  };
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
