export type HealthStatus = 'health' | 'error' | 'warning' | 'none';

/**
 *
 * @param percent 0 - 100
 * @param count
 * @returns
 */
export function parseHealthStatusByPercent(
  percent: number,
  count: number
): HealthStatus {
  if (percent >= 95) {
    return 'health';
  } else if (percent === 0 && count === 0) {
    return 'none';
  } else if (percent === 0 && count !== 0) {
    return 'error';
  } else {
    return 'warning';
  }
}

export function getStatusBgColorClassName(status: HealthStatus): string {
  if (status === 'health') {
    return 'bg-green-500';
  } else if (status === 'error') {
    return 'bg-red-600';
  } else if (status === 'warning') {
    return 'bg-yellow-400';
  } else if (status === 'none') {
    return 'bg-gray-400';
  } else {
    return '';
  }
}
