import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { Prisma } from '@prisma/client';
import { FilterInfoType, FilterInfoValue } from '@tianji/shared';
import { InsightsSqlBuilder } from './shared.js';
import { processGroupedTimeSeriesData } from './utils.js';
import { quoteSqlIdentifier, quoteSqlIdentifierPath } from '../../utils/sql.js';

const { sql, raw } = Prisma;

const AIGATEWAY_NUMERIC_METRIC_FIELDS = [
  'inputToken',
  'outputToken',
  'cacheReadInputToken',
  'cacheWriteInputToken',
  'price',
  'duration',
  'ttft',
  'tpot',
];

const AIGATEWAY_STANDARD_FIELDS = [
  'gatewayId',
  'modelName',
  'modelProvider',
  'status',
  'stream',
  'inputToken',
  'outputToken',
  'cacheReadInputToken',
  'cacheWriteInputToken',
  'duration',
  'ttft',
  'tpot',
  'price',
  'userId',
];

function getAIGatewayFieldSql(name: string): Prisma.Sql | null {
  if (!AIGATEWAY_STANDARD_FIELDS.includes(name)) {
    return null;
  }

  if (name === 'status') {
    return sql`${quoteSqlIdentifierPath('AIGatewayLogs', 'status')}::text`;
  }

  return quoteSqlIdentifierPath('AIGatewayLogs', name);
}

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
          return sql`count(1) as ${quoteSqlIdentifier(alias)}`;
        }

        // For standard fields, directly count
        if (AIGATEWAY_NUMERIC_METRIC_FIELDS.includes(item.name)) {
          const valueField = quoteSqlIdentifierPath('AIGatewayLogs', item.name);
          return sql`sum(${valueField}) as ${quoteSqlIdentifier(alias)}`;
        }
      } else if (item.math === 'sessions') {
        // AIGatewayLogs has no concept of sessions, but can be grouped by gatewayId
        if (item.name === '$all_event') {
          return sql`count(distinct "gatewayId") as ${quoteSqlIdentifier(alias)}`;
        }
      } else if (item.math === 'avg') {
        if (!AIGATEWAY_NUMERIC_METRIC_FIELDS.includes(item.name)) {
          return null;
        }

        if (item.name === 'tpot') {
          return sql`AVG("AIGatewayLogs"."tpot") FILTER (WHERE "AIGatewayLogs"."tpot" > -1) as ${quoteSqlIdentifier(alias)}`;
        }

        const valueField = quoteSqlIdentifierPath('AIGatewayLogs', item.name);
        return sql`AVG(${valueField}) as ${quoteSqlIdentifier(alias)}`;
      } else if (item.math.startsWith('p')) {
        if (!AIGATEWAY_NUMERIC_METRIC_FIELDS.includes(item.name)) {
          return null;
        }

        const percentile = Number(item.math.replace('p', '')) / 100;
        const valueField = quoteSqlIdentifierPath('AIGatewayLogs', item.name);

        if (item.name === 'tpot') {
          return sql`PERCENTILE_CONT(${raw(`${percentile}`)}) WITHIN GROUP (ORDER BY ${valueField}) FILTER (WHERE "AIGatewayLogs"."tpot" > -1) AS ${quoteSqlIdentifier(alias)}`;
        }

        return sql`PERCENTILE_CONT(${raw(`${percentile}`)}) WITHIN GROUP (ORDER BY ${valueField}) AS ${quoteSqlIdentifier(alias)}`;
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
          const groupField = getAIGatewayFieldSql(g.value);
          if (!groupField) {
            continue;
          }

          groupSelectQueryArr.push(
            sql`${groupField} as ${quoteSqlIdentifier(`%${g.value}`)}`
          );
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const cg of g.customGroups) {
            groupSelectQueryArr.push(
              sql`${this.buildFilterQueryOperator(
                g.value,
                g.type,
                cg.filterOperator,
                cg.filterValue
              )} as ${quoteSqlIdentifier(`%${g.value}|${cg.filterOperator}|${cg.filterValue}`)}`
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
    if (AIGATEWAY_STANDARD_FIELDS.includes(name)) {
      // Special handling for enum fields that need type casting
      const valueField = getAIGatewayFieldSql(name)!;

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
      const valueField = sql`("AIGatewayLogs"."requestPayload"->> ${field})${type === 'number' ? raw('::int') : type === 'boolean' ? raw('::boolean') : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    } else if (name.startsWith('response.')) {
      const field = name.replace('response.', '');
      const valueField = sql`("AIGatewayLogs"."responsePayload"->> ${field})${type === 'number' ? raw('::int') : type === 'boolean' ? raw('::boolean') : Prisma.empty}`;
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
