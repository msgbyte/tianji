import { z } from 'zod';

export const baseFilterSchema = z.object({
  url: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
  timezone: z.string(),
});

export const websiteFilterSchema = baseFilterSchema.merge(
  z.object({
    referrer: z.string(),
    title: z.string(),
    os: z.string(),
    browser: z.string(),
    device: z.string(),
    language: z.string(),
    event: z.string(),
    utm_source: z.string(),
    utm_medium: z.string(),
    utm_campaign: z.string(),
    utm_term: z.string(),
    utm_content: z.string(),
  })
);

export const statsItemType = z.object({
  value: z.number(),
  prev: z.number(),
});

export const baseStatsSchema = z.object({
  pageviews: statsItemType,
  uniques: statsItemType,
});

export const websiteStatsSchema = baseStatsSchema.merge(
  z.object({
    totaltime: statsItemType,
    bounces: statsItemType,
  })
);
