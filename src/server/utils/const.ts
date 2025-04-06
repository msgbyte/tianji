export const COLLECTION_TYPE = {
  event: 'event',
  identify: 'identify',
};

export const DESKTOP_OS = [
  'BeOS',
  'Chrome OS',
  'Linux',
  'Mac OS',
  'Open BSD',
  'OS/2',
  'QNX',
  'Sun OS',
  'Windows 10',
  'Windows 2000',
  'Windows 3.11',
  'Windows 7',
  'Windows 8',
  'Windows 8.1',
  'Windows 95',
  'Windows 98',
  'Windows ME',
  'Windows Server 2003',
  'Windows Vista',
  'Windows XP',
];

export const MOBILE_OS = [
  'Amazon OS',
  'Android OS',
  'BlackBerry OS',
  'iOS',
  'Windows Mobile',
];

export const DESKTOP_SCREEN_WIDTH = 1920;
export const LAPTOP_SCREEN_WIDTH = 1024;
export const MOBILE_SCREEN_WIDTH = 479;

export const URL_LENGTH = 500;
export const EVENT_NAME_LENGTH = 50;

export const DATETIME_REGEX =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3}(Z|\+[0-9]{2}:[0-9]{2})?)?$/;

export const EVENT_TYPE = {
  pageView: 1,
  customEvent: 2,
} as const;

export const DATA_TYPE = {
  string: 1,
  number: 2,
  boolean: 3,
  date: 4,
  array: 5,
} as const;

export const EVENT_COLUMNS = ['url', 'referrer', 'title', 'query', 'event'];

export const SESSION_COLUMNS = [
  'browser',
  'os',
  'device',
  'screen',
  'language',
  'country',
  'region',
  'city',
];

export const OPERATORS = {
  equals: 'eq',
  notEquals: 'neq',
  set: 's',
  notSet: 'ns',
  contains: 'c',
  doesNotContain: 'dnc',
  true: 't',
  false: 'f',
  greaterThan: 'gt',
  lessThan: 'lt',
  greaterThanEquals: 'gte',
  lessThanEquals: 'lte',
  before: 'bf',
  after: 'af',
} as const;

export const FILTER_COLUMNS = {
  url: 'urlPath',
  referrer: 'referrerDomain',
  title: 'pageTitle',
  query: 'urlQuery',
  os: 'os',
  browser: 'browser',
  device: 'device',
  country: 'country',
  region: 'subdivision1',
  city: 'city',
  language: 'language',
  event: 'eventName',
};

export const DEFAULT_RESET_DATE = '2000-01-01';

export enum OPENAPI_TAG {
  GLOBAL = 'Global',
  WORKSPACE = 'Workspace',
  USER = 'User',
  WEBSITE = 'Website',
  APPLICATION = 'Application',
  MONITOR = 'Monitor',
  AUDIT_LOG = 'AuditLog',
  BILLING = 'Billing',
  TELEMETRY = 'Telemetry',
  SURVEY = 'Survey',
  FEED = 'Feed',
  AI = 'AI',
  AI_GATEWAY = 'AIGateway',
}
