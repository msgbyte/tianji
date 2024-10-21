import { Request, Response } from 'express';
import Prometheus from 'prom-client';

export interface ApiMetricsOpts {
  metricsPath?: string;
  defaultMetricsInterval?: number;
  durationBuckets?: number[];
  requestSizeBuckets?: number[];
  responseSizeBuckets?: number[];
  useUniqueHistogramName?: boolean;
  metricsPrefix?: string;
  excludeRoutes?: string[];
  includeQueryParams?: boolean;
  additionalLabels?: string[];
  extractAdditionalLabelValuesFn?: (
    req: Request,
    res: Response
  ) => Record<string, unknown>;
}

export interface CollectorOpts {
  durationBuckets?: number[];
  countClientErrors?: boolean;
  useUniqueHistogramName?: boolean;
  prefix?: string;
}

export interface SetupOptions {
  metricsRoute?: string;
  excludeRoutes?: string[];
  includeQueryParams?: boolean;
  defaultMetricsInterval?: number;
  additionalLabels?: string[];
  extractAdditionalLabelValuesFn?: (
    req: Request,
    res: Response
  ) => Record<string, unknown>;
  responseTimeHistogram?: Prometheus.Metric<string> | undefined;
  [other: string]: any;
}
