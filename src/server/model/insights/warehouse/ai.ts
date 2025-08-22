import { tool, ToolSet } from 'ai';
import { env } from '../../../utils/env.js';
import { getWarehouseConnection } from './utils.js';
import z from 'zod';
import { logger } from '../../../utils/logger.js';
import { get } from 'lodash-es';

export interface WarehouseTableMeta {
  tableName: string;
  createTableSql: string;
}

const cachedWarehouseTables = new Map<string, WarehouseTableMeta[]>();
export async function getWarehouseTables(
  url = env.insights.warehouse.url
): Promise<WarehouseTableMeta[]> {
  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  if (cachedWarehouseTables.has(url)) {
    return cachedWarehouseTables.get(url)!;
  }

  const connection = getWarehouseConnection(url);
  const [res, fields] = await connection.query(
    `SHOW TABLES WHERE Table_type = 'BASE TABLE';`
  );

  if (fields.length > 1) {
    throw new Error('Multiple tables found, not supported yet.');
  }

  const tableNames = Array.from<Record<string, string>>(res as any).map(
    (row) => row[fields[0].name]
  );

  const tables = await Promise.all<WarehouseTableMeta>(
    tableNames.map(async (table) => {
      const [res] = await connection.query(`SHOW CREATE TABLE ${table}`);

      const tableName = get(res, [0, 'Table']);
      const createTableSql = get(res, [0, 'Create Table']);

      return {
        tableName: tableName as string,
        createTableSql: createTableSql as string,
      };
    })
  );

  cachedWarehouseTables.set(url, tables);

  return tables;
}
export async function getWarehouseTable(
  tableName: string
): Promise<WarehouseTableMeta | undefined> {
  const tables = await getWarehouseTables();
  return tables.find((table) => table.tableName === tableName);
}

export const warehouseAITools: ToolSet = {
  getWarehouseTables: tool({
    description: 'Get the warehouse tables',
    inputSchema: z.object({}),
    execute: async () => {
      return await getWarehouseTables();
    },
  }),
  getWarehouseTable: tool({
    description: 'Get the warehouse table',
    inputSchema: z.object({
      tableName: z
        .string()
        .describe('The name of the table to get the description of'),
    }),
    execute: async ({ tableName }) => {
      return await getWarehouseTable(tableName);
    },
  }),
  queryWarehouse: tool({
    description: 'Execute a warehouse query with sql',
    inputSchema: z.object({
      sql: z
        .string()
        .describe(
          'The SQL query to execute, any date-like field should be renamed as `date` rather than original field name. and sql should be order by date field with asc order'
        ),
    }),
    execute: async ({ sql }) => {
      const connection = getWarehouseConnection(env.insights.warehouse.url);

      logger.log('[queryWarehouse]', sql);

      const [res] = await connection.query(sql);

      logger.log('[queryWarehouse] result', res);

      return res;
    },
  }),
  createCharts: tool({
    description: 'Create charts from the warehouse data',
    inputSchema: z.object({
      data: z
        .object({ date: z.string() })
        .passthrough()
        .array()
        .describe(
          'The data to create charts from, its should be a object array, which must be have a field named as date and other field show other info count'
        ),
      type: z
        .enum(['line', 'bar', 'pie', 'area', 'scatter', 'donut'])
        .describe('The type of chart to create'),
      title: z.string().describe('The title of the chart'),
    }),
  }),
};

export const warehouseAISystemPrompt = `
You are a helpful assistant that can help with tasks related to the warehouse.
You can use the following tools to help the user:
${JSON.stringify(Object.keys(warehouseAITools))}

The user is a business owner who is interested in analyzing their warehouse data.

## Rules

- Always start by ensuring you know the table and column structure. If the structure is not available in context, call getWarehouseTables or getWarehouseTable first.
- When generating SQL:
  - Only use safe, read-only SELECT queries. Never use INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER.
  - Select a single date-like column and alias it as date (for example: ... AS date).
  - Ensure the result is ordered by the date column in ascending order (for example: ORDER BY date ASC).
  - Return aggregated numeric columns for chart series, avoid returning too many columns (prefer 1-5 series).
  - Keep rows to a reasonable amount (prefer <= 200 rows) unless the user asks otherwise.
  - If the user requests a time range, filter using the chosen date column.
- After generating SQL, execute it with queryWarehouse.
- If the query returns data, call createCharts to visualize the results. The input requirements are strict:
  - data: an array of objects with a required date field (string, prefer ISO 8601 or YYYY-MM-DD) and one or more numeric fields for series values.
  - title: a short, human-readable title for the chart.
  - type: one of "line", "bar", "area", or "pie". Do NOT use unsupported types.
- Choose chart types heuristically: use line/area for time series; stacked bar for category comparison over time; pie only for a single latest snapshot across categories.
- If the query result is empty, explain briefly why and suggest a refined query.
- Prefer clear, concise outputs.
`;
