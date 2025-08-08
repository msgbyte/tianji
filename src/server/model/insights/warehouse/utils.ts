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

const warehouseLongTableInsightsApplicationSchema = z.object({
  databaseUrl: z.string().optional(),
  name: z.string(),
  type: z.literal('longTable').optional(), // long table, default
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

const warehouseWideTableInsightsApplicationSchema = z.object({
  databaseUrl: z.string().optional(),
  name: z.string(),
  type: z.literal('wideTable'), // wide table
  tableName: z.string(),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string().default('string'),
    })
  ),
  distinctField: z.string(),
  createdAtField: z.string(),
  createdAtFieldType: dateTypeSchema.default('timestampMs'),
  dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
});

export const warehouseInsightsApplicationSchema = z.union([
  warehouseLongTableInsightsApplicationSchema,
  warehouseWideTableInsightsApplicationSchema,
]);

export type WarehouseInsightsApplication = z.infer<
  typeof warehouseInsightsApplicationSchema
>;

export type WarehouseLongTableInsightsApplication = z.infer<
  typeof warehouseLongTableInsightsApplicationSchema
>;

export type WarehouseWideTableInsightsApplication = z.infer<
  typeof warehouseWideTableInsightsApplicationSchema
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

export function findWarehouseApplication(name: string) {
  return getWarehouseApplications().find((app) => app.name === name);
}

const connections = new Map<string, Pool>();
export function getWarehouseConnection(url = env.insights.warehouse.url) {
  if (!env.insights.warehouse.enable) {
    throw new Error('Warehouse is not enabled');
  }

  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  let connection = connections.get(url);
  if (!connection) {
    connection = createPool(url);
    connections.set(url, connection);
  }

  return connection;
}
