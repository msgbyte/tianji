export const ROLES = {
  // System Role
  admin: 'admin',
  user: 'user',

  // Workspace Role
  owner: 'owner',
  readOnly: 'readOnly',
} as const;

export const HOSTNAME_REGEX =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;

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
