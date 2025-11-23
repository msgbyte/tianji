import {
  tool,
  ToolSet,
  streamText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  LanguageModel,
} from 'ai';
import {
  getWarehouseConnection,
  getWarehouseTable,
  getWarehouseTables,
} from './utils.js';
import z from 'zod';
import { logger } from '../../../utils/logger.js';
import { omit } from 'lodash-es';
import { inferTimeRangeFromDates } from '@tianji/shared';
import dayjs from 'dayjs';
import { chatByCountryDemo } from './__fixtures__/ai_sample.js';
import { env } from '../../../utils/env.js';

export const createWarehouseAITools = (connectionUrl?: string): ToolSet => ({
  getWarehouseTables: tool({
    description: 'Get the warehouse tables',
    inputSchema: z.object({}),
    execute: async () => {
      return await getWarehouseTables(connectionUrl);
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
      return await getWarehouseTable(tableName, connectionUrl);
    },
  }),
  queryWarehouse: tool({
    description: 'Execute a warehouse query with sql',
    inputSchema: z.object({
      sql: z
        .string()
        .describe(
          'The SQL query to execute, any date-like field should be renamed as `date` rather than original field name. and sql should be order by date field with asc order. If a valid time range is not provided or cannot be inferred, return an error message instead of SQL. Prefer single-table queries; use JOINs only when a single table isn’t enough.'
        ),
      title: z
        .string()
        .describe(
          'Query title, should be a human-readable title for the chart.'
        ),
      metrics: z
        .array(
          z.object({
            // alias: z
            //   .string()
            //   .optional()
            //   .describe(
            //     'The name of the group, just for display, should be a human-readable title for the chart.'
            //   ),
            name: z
              .string()
              .describe('The key of the group, should be same with sql'),
          })
        )
        .describe(
          'The metrics to create charts from, its should be a object array, which must be have a field named as name and alias.'
        ),
      groups: z
        .array(
          z.object({
            // name: z
            //   .string()
            //   .describe(
            //     'The name of the group, just for display, should be a human-readable title for the chart.'
            //   ),
            value: z
              .string()
              .describe('The value of the group, should be same with sql'),
          })
        )
        .describe(
          'The groups to create charts from, its should be a object array, which must be have a field named as name and value. not include date field.'
        ),
      time: z
        .object({
          unit: z
            .enum(['hour', 'day', 'month', 'year'])
            .describe('The unit of the time range'),
        })
        .describe('The time range to query the warehouse.'),
      chartType: z
        .enum(['line', 'bar', 'pie', 'area'])
        .default('line')
        .describe('The best chart type to describe the query data'),
    }),
    outputSchema: z.object({
      data: z
        .array(z.object({ date: z.string() }).passthrough())
        .describe(
          'The data to create charts from, its should be a object array, which must be have a field named as date and other field show other info count'
        ),
      time: z
        .object({
          startAt: z
            .number()
            .describe('The start time of the time range, unix timestamp, ms'),
          endAt: z
            .number()
            .describe('The end time of the time range, unix timestamp, ms'),
          unit: z
            .enum(['hour', 'day', 'month', 'year'])
            .describe('The unit of the time range'),
        })
        .describe('The time range to create charts from'),
    }),
    execute: async ({ sql, time }) => {
      if (!connectionUrl) {
        throw new Error('Connection url is not set');
      }

      const connection = getWarehouseConnection(connectionUrl);

      // Auto-add LIMIT if not present
      let finalSql = sql.trim();
      const trimmedSqlLower = finalSql.toLowerCase();
      if (!trimmedSqlLower.includes('limit')) {
        // Remove trailing semicolon if present
        if (finalSql.endsWith(';')) {
          finalSql = finalSql.slice(0, -1).trim();
        }
        finalSql = `${finalSql} LIMIT 1000`;
      }

      logger.info('[queryWarehouse]:' + finalSql);

      // const [res] = env.isDev
      //   ? [chatByCountryDemo] // TODO: remove this after testing
      //   : await connection.query(finalSql);
      const [res] = await connection.query(finalSql);

      logger.info('[queryWarehouse] result:' + JSON.stringify(res));

      const defaultStartAt = dayjs()
        .subtract(7, 'day')
        .startOf('day')
        .valueOf();
      const defaultEndAt = dayjs().endOf('day').valueOf();

      if (Array.isArray(res)) {
        const timeRange = inferTimeRangeFromDates(
          res.map((item: any) => item.date),
          time.unit ?? 'day'
        );

        return {
          data: Array.isArray(res) ? res : ([] as any[]),
          time: {
            startAt: timeRange?.[0] ?? defaultStartAt,
            endAt: timeRange?.[1] ?? defaultEndAt,
            unit: time.unit ?? 'day',
          },
        };
      }

      return {
        data: [],
        time: {
          startAt: defaultStartAt,
          endAt: defaultEndAt,
          unit: 'day',
        },
      };
    },
  }),
});

// Default tools for backward compatibility
export const warehouseAITools = createWarehouseAITools();

export const warehouseAISystemPrompt = ({
  needGetContext,
  tools,
}: {
  needGetContext: boolean;
  tools?: ToolSet;
}) => {
  const toolSet = tools || warehouseAITools;
  return `
You are a helpful assistant that can help with tasks related to the warehouse.
You can use the following tools to help the user:
${JSON.stringify(needGetContext ? Object.keys(toolSet) : omit(Object.keys(toolSet), ['getWarehouseTables', 'getWarehouseTable']))}

The user is a business owner who is interested in analyzing their warehouse data.

## Rules

${needGetContext ? '- Always start by ensuring you know the table and column structure. If the structure is not available in context, call getWarehouseTables or getWarehouseTable first.' : ''}
- When generating SQL:
  - Only use safe, read-only SELECT queries. Never use INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER.
  - Select a single date-like column and alias it as date (for example: ... AS date).
  - Ensure the result is ordered by the date column in ascending order (for example: ORDER BY date ASC).
  - Return aggregated numeric columns for chart series, avoid returning too many columns (prefer 1-5 series).
  - Keep rows to a reasonable amount (prefer <= 200 rows) unless the user asks otherwise.
  - Always include a time range for queries. If none is specified by the user, treat it as the last 7 days using the chosen date column.
  - Use the chosen date column to apply the time range filter.
- After generating SQL, execute it with queryWarehouse.
- Choose chart types heuristically: use line/area for time series; stacked bar for category comparison over time; pie only for a single latest snapshot across categories.
- If the query result is empty, explain briefly why and suggest a refined query.
- Prefer clear, concise outputs. dont generate any image which like attachment.
`;
};

/**
 * Create a streaming text response for warehouse AI chat
 * @param model - The language model to use
 * @param inputMessages - System messages with context
 * @param messages - User conversation messages
 * @param aiTools - The warehouse AI tools to use
 * @returns StreamText result that can be piped to response
 */
export function createWarehouseAIStream({
  model,
  inputMessages = [],
  messages,
  aiTools,
}: {
  model: LanguageModel;
  inputMessages: Parameters<typeof streamText>[0]['messages'];
  messages: Array<Omit<UIMessage, 'id'>>;
  aiTools: ToolSet;
}) {
  return streamText({
    model,
    messages: [...inputMessages, ...convertToModelMessages(messages)],
    stopWhen: stepCountIs(5),
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        inputSchema: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        inputSchema: z.object({}),
      },
      ...aiTools,
    },
  });
}
