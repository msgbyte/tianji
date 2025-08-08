import { z } from 'zod';
import { createPool, Pool } from 'mysql2/promise';
import { env } from '../../../utils/env.js';

// MySQL date formats for different time units
export const MYSQL_DATE_FORMATS = {
  minute: '%Y-%m-%d %H:%i:00',
  hour: '%Y-%m-%d %H:00:00',
  day: '%Y-%m-%d',
  month: '%Y-%m-01',
  year: '%Y-01-01',
} as const;

export const dateTypeSchema = z.enum([
  'timestamp', // for example: 1739203200
  'timestampMs', // for example: 1739203200000
  'date', // for example: 2025-08-01
  'datetime', // for example: 2025-08-01 00:00:00
]);

export const warehouseInsightsApplicationSchema = z.object({
  name: z.string(),
  type: z.enum(['longTable', 'wideTable']).default('longTable'), // long table or wide table, TODO: implement wide table support
  eventTable: z.object({
    name: z.string(),
    eventNameField: z.string(),
    createdAtField: z.string(),
    createdAtFieldType: dateTypeSchema.default('timestampMs'),
    dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
  }),
  eventParametersTable: z.object({
    name: z.string(),
    eventNameField: z.string(),
    paramsNameField: z.string(),
    paramsValueField: z.string(),
    paramsValueNumberField: z.string().optional(),
    paramsValueStringField: z.string().optional(),
    paramsValueDateField: z.string().optional(),
    createdAtField: z.string(),
    createdAtFieldType: dateTypeSchema.default('timestampMs'),
    dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
  }),
});

export type WarehouseInsightsApplication = z.infer<
  typeof warehouseInsightsApplicationSchema
>;

let applications: WarehouseInsightsApplication[] | null = null;
export function getWarehouseApplications() {
  if (!applications) {
    applications = warehouseInsightsApplicationSchema
      .array()
      .parse(JSON.parse(env.insights.warehouse.applicationsJson || '[]'));
  }

  return applications;
}

let connection: Pool | null = null;
export function getWarehouseConnection() {
  if (!env.insights.warehouse.enable || !env.insights.warehouse.url) {
    throw new Error('Warehouse is not enabled');
  }

  if (!connection) {
    connection = createPool(env.insights.warehouse.url);
  }

  return connection;
}
