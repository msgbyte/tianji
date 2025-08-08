import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { Prisma } from '@prisma/client';
import { FilterInfoType, FilterInfoValue } from '@tianji/shared';
import { InsightsSqlBuilder } from './shared.js';
import { processGroupedTimeSeriesData } from './utils.js';

const { sql, raw } = Prisma;

export class AIGatewayInsightsSqlBuilder extends InsightsSqlBuilder {
  getTableName() {
    return 'AIGatewayLogs';
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;
    return metrics.map((item) => {
      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return sql`count(1) as "$all_event"`;
        }

        // For standard fields, directly count
        // TODO: maybe use other math functions
        if (['inputToken', 'outputToken', 'price'].includes(item.name)) {
          return sql`sum("AIGatewayLogs"."${raw(item.name)}") as ${raw(`"${item.name}"`)}`;
        }
      } else if (item.math === 'sessions') {
        // AIGatewayLogs has no concept of sessions, but can be grouped by gatewayId
        if (item.name === '$all_event') {
          return sql`count(distinct "gatewayId") as "$all_event"`;
        }
      }

      return null;
    });
  }

  buildWhereQueryArr() {
    const { insightId, time, filters } = this.query;
    const { startAt, endAt } = time;

    return [
      // gatewayId
      sql`"AIGatewayLogs"."gatewayId" = ${insightId}`,

      // date range
      this.buildDateRangeQuery('"AIGatewayLogs"."createdAt"', startAt, endAt),

      ...filters.map((filter) =>
        this.buildFilterQueryOperator(
          filter.name,
          filter.type,
          filter.operator,
          filter.value
        )
      ),
    ];
  }

  private buildFilterQueryOperator(
    name: string,
    type: FilterInfoType,
    operator: string,
    value: FilterInfoValue | null
  ): Prisma.Sql {
    // Process standard fields
    if (
      [
        'gatewayId',
        'modelName',
        'status',
        'stream',
        'inputToken',
        'outputToken',
        'duration',
        'ttft',
        'price',
      ].includes(name)
    ) {
      const valueField = sql`"AIGatewayLogs"."${raw(name)}"${type === 'number' ? Prisma.empty : type === 'boolean' ? Prisma.empty : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    }
    // Process JSON fields
    else if (name.startsWith('request.')) {
      const field = name.replace('request.', '');
      const valueField = sql`("AIGatewayLogs"."requestPayload"->> '${field}')${type === 'number' ? raw('::int') : type === 'boolean' ? raw('::boolean') : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    } else if (name.startsWith('response.')) {
      const field = name.replace('response.', '');
      const valueField = sql`("AIGatewayLogs"."responsePayload"->> '${field}')${type === 'number' ? raw('::int') : type === 'boolean' ? raw('::boolean') : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    }

    return sql`1 = 1`;
  }
}

export async function insightsAIGateway(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const builder = new AIGatewayInsightsSqlBuilder(query, {
    ...context,
    useClickhouse: false,
  });
  const sql = builder.build();

  const data = await builder.executeQuery(sql);

  const result = processGroupedTimeSeriesData(query, context, data);

  return result;
}
