import { z } from 'zod';

export const websiteFilterSchema = z.object({
  timezone: z.string(),
  url: z.string(),
  referrer: z.string(),
  title: z.string(),
  os: z.string(),
  browser: z.string(),
  device: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
});

const websiteStatsItemType = z.object({
  value: z.number(),
  change: z.number(),
});

export const websiteStatsSchema = z.object({
  bounces: websiteStatsItemType,
  pageviews: websiteStatsItemType,
  totaltime: websiteStatsItemType,
  uniques: websiteStatsItemType,
});
