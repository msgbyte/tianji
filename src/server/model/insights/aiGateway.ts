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
      const alias = item.alias ?? item.name;

      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return sql`count(1) as "$all_event"`;
        }

        // For standard fields, directly count
        if (
          ['inputToken', 'outputToken', 'price', 'duration', 'ttft'].includes(
            item.name
          )
        ) {
          return sql`sum("AIGatewayLogs"."${raw(item.name)}") as ${raw(`"${alias}"`)}`;
        }
      } else if (item.math === 'sessions') {
        // AIGatewayLogs has no concept of sessions, but can be grouped by gatewayId
        if (item.name === '$all_event') {
          return sql`count(distinct "gatewayId") as ${raw(`"${alias}"`)}`;
        }
      } else if (item.math === 'avg') {
        return sql`AVG("AIGatewayLogs"."${raw(item.name)}") as ${raw(`"${alias}"`)}`;
      } else if (item.math.startsWith('p')) {
        const percentile = Number(item.math.replace('p', '')) / 100;
        return sql`PERCENTILE_CONT(${raw(`${percentile}`)}) WITHIN GROUP (ORDER BY ${raw(`"${item.name}"`)}) AS ${raw(`"${alias}"`)}`;
      }

      return null;
    });
  }

  buildGroupSelectQueryArr() {
    const { groups } = this.query;
    let groupSelectQueryArr: Prisma.Sql[] = [];

    if (groups.length > 0) {
      for (const g of groups) {
        if (!g.customGroups) {
          // Handle different field types for grouping
          let groupField: Prisma.Sql;
          if (g.value === 'status') {
            // Cast enum to text for grouping
            groupField = sql`"AIGatewayLogs"."status"::text`;
          } else {
            // String fields (modelName, gatewayId, etc.)
            groupField = sql`"AIGatewayLogs"."${raw(g.value)}"`;
          }

          groupSelectQueryArr.push(sql`${groupField} as "%${raw(g.value)}"`);
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const cg of g.customGroups) {
            groupSelectQueryArr.push(
              sql`${this.buildFilterQueryOperator(
                g.value,
                g.type,
                cg.filterOperator,
                cg.filterValue
              )} as "%${raw(`${g.value}|${cg.filterOperator}|${cg.filterValue}`)}"`
            );
          }
        }
      }
    }

    return groupSelectQueryArr;
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
      // Special handling for enum fields that need type casting
      let valueField: Prisma.Sql;
      if (name === 'status') {
        // Cast enum to text for comparison
        valueField = sql`"AIGatewayLogs"."status"::text`;
      } else {
        // String fields
        valueField = sql`"AIGatewayLogs"."${raw(name)}"`;
      }

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
