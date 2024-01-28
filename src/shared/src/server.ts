import type { ServerStatusInfo } from '../../types';

export function isServerOnline(info: ServerStatusInfo): boolean {
  return new Date(info.updatedAt).valueOf() + info.timeout * 1000 > Date.now();
}
