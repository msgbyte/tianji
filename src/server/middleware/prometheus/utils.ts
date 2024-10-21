'use strict';

type MetricNames = { [key: string]: string };

const getMetricNames = (
  metricNames: MetricNames,
  useUniqueHistogramName: boolean,
  metricsPrefix: string,
  projectName: string
): MetricNames => {
  const prefix = useUniqueHistogramName === true ? projectName : metricsPrefix;

  if (prefix) {
    Object.keys(metricNames).forEach((key) => {
      metricNames[key] = `${prefix}_${metricNames[key]}`;
    });
  }

  return metricNames;
};

const isArray = (input: unknown): input is any[] => Array.isArray(input);

const isFunction = (input: unknown): input is Function =>
  typeof input === 'function';

const isString = (input: unknown): input is string => typeof input === 'string';

const shouldLogMetrics = (excludeRoutes: string[], route: string): boolean =>
  excludeRoutes.every((path) => !route.includes(path));

interface ValidateInputParams<T> {
  input: T | undefined;
  isValidInputFn: (input: T) => boolean;
  defaultValue: T;
  errorMessage: string;
}

const validateInput = <T>({
  input,
  isValidInputFn,
  defaultValue,
  errorMessage,
}: ValidateInputParams<T>): T => {
  if (typeof input !== 'undefined') {
    if (isValidInputFn(input)) {
      return input;
    } else {
      throw new Error(errorMessage);
    }
  }

  return defaultValue;
};

export {
  getMetricNames,
  isArray,
  isFunction,
  isString,
  shouldLogMetrics,
  validateInput,
};
