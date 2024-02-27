import { z } from 'zod';

export const baseFilterSchema = z.object({
  url: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
});

export const websiteFilterSchema = baseFilterSchema.merge(
  z.object({
    timezone: z.string(),
    referrer: z.string(),
    title: z.string(),
    os: z.string(),
    browser: z.string(),
    device: z.string(),
  })
);

const websiteStatsItemType = z.object({
  value: z.number(),
  prev: z.number(),
});

export const websiteStatsSchema = z.object({
  bounces: websiteStatsItemType,
  pageviews: websiteStatsItemType,
  totaltime: websiteStatsItemType,
  uniques: websiteStatsItemType,
});
