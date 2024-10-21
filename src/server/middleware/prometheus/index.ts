import Prometheus from 'prom-client';
import * as utils from './utils.js';
import { SetupOptions, ApiMetricsOpts } from './types.js';
import { ExpressMiddleware } from './middleware.js';

export function prometheusApiVersion(options: ApiMetricsOpts = {}) {
  const appVersion = '1.0.0';
  const projectName = 'tianji';

  const {
    metricsPath,
    defaultMetricsInterval = 10000,
    durationBuckets,
    requestSizeBuckets,
    responseSizeBuckets,
    useUniqueHistogramName,
    metricsPrefix,
    excludeRoutes,
    includeQueryParams,
    additionalLabels = [],
    extractAdditionalLabelValuesFn,
  } = options;

  const setupOptions: SetupOptions = {};

  setupOptions.metricsRoute = utils.validateInput({
    input: metricsPath,
    isValidInputFn: utils.isString,
    defaultValue: '/_prom/metrics',
    errorMessage: 'metricsPath should be an string',
  });

  setupOptions.excludeRoutes = utils.validateInput({
    input: excludeRoutes,
    isValidInputFn: utils.isArray,
    defaultValue: [],
    errorMessage: 'excludeRoutes should be an array',
  });

  setupOptions.includeQueryParams = includeQueryParams;
  setupOptions.defaultMetricsInterval = defaultMetricsInterval;

  setupOptions.additionalLabels = utils.validateInput({
    input: additionalLabels,
    isValidInputFn: utils.isArray,
    defaultValue: [],
    errorMessage: 'additionalLabels should be an array',
  });

  setupOptions.extractAdditionalLabelValuesFn = utils.validateInput({
    input: extractAdditionalLabelValuesFn,
    isValidInputFn: utils.isFunction,
    defaultValue: () => ({}),
    errorMessage: 'extractAdditionalLabelValuesFn should be a function',
  });

  const metricNames = utils.getMetricNames(
    {
      http_request_duration_seconds: 'http_request_duration_seconds',
      app_version: 'app_version',
      http_request_size_bytes: 'http_request_size_bytes',
      http_response_size_bytes: 'http_response_size_bytes',
      defaultMetricsPrefix: '',
    },
    useUniqueHistogramName ?? false,
    metricsPrefix ?? '',
    projectName
  );

  Prometheus.collectDefaultMetrics({
    eventLoopMonitoringPrecision: defaultMetricsInterval,
    prefix: `${metricNames.defaultMetricsPrefix}`,
  });

  PrometheusRegisterAppVersion(appVersion, metricNames.app_version);

  const metricLabels = ['method', 'route', 'code', ...additionalLabels].filter(
    Boolean
  );

  // Buckets for response time from 1ms to 500ms
  const defaultDurationSecondsBuckets = [
    0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5,
  ];
  // Buckets for request size from 5 bytes to 10000 bytes
  const defaultSizeBytesBuckets = [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
  ];

  setupOptions.responseTimeHistogram =
    Prometheus.register.getSingleMetric(
      metricNames.http_request_duration_seconds
    ) ||
    new Prometheus.Histogram({
      name: metricNames.http_request_duration_seconds,
      help: 'Duration of HTTP requests in seconds',
      labelNames: metricLabels,
      buckets: durationBuckets || defaultDurationSecondsBuckets,
    });

  setupOptions.requestSizeHistogram =
    Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes) ||
    new Prometheus.Histogram({
      name: metricNames.http_request_size_bytes,
      help: 'Size of HTTP requests in bytes',
      labelNames: metricLabels,
      buckets: requestSizeBuckets || defaultSizeBytesBuckets,
    });

  setupOptions.responseSizeHistogram =
    Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes) ||
    new Prometheus.Histogram({
      name: metricNames.http_response_size_bytes,
      help: 'Size of HTTP response in bytes',
      labelNames: metricLabels,
      buckets: responseSizeBuckets || defaultSizeBytesBuckets,
    });

  const middleware = new ExpressMiddleware(setupOptions);
  return middleware.middleware.bind(middleware);
}

function PrometheusRegisterAppVersion(appVersion: string, metricName: string) {
  const version = new Prometheus.Gauge({
    name: metricName,
    help: 'The service version by package.json',
    labelNames: ['version', 'major', 'minor', 'patch'],
  });

  const [major, minor, patch] = appVersion.split('.');
  version.labels(appVersion, major, minor, patch).set(1);
}
