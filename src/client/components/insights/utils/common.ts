import { t } from '@i18next-toolkit/react';
import { FilterInfoValue, MetricsInfo, numberToLetter } from '@tianji/shared';

/**
 * check if the value is valid for filter
 * @param value
 * @returns
 */
export function isValidFilterValue(value: FilterInfoValue) {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof value === 'number') {
    return true;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return true;
    }

    return value.every(
      (item) => typeof item === 'string' || typeof item === 'number'
    );
  }

  return false;
}

export function getMetricLabel(metricName: string) {
  if (metricName === '$all_event') {
    return t('All Events');
  }
  if (metricName === '$page_view') {
    return t('Page View');
  }

  return metricName;
}

export function getMetricAlias(metric: MetricsInfo, index: number) {
  if (metric.alias) {
    return metric.alias;
  }

  return `${numberToLetter(index + 1)}.${getMetricLabel(metric.name)}`;
}
