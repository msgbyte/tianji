import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { printSQL } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { FilterInfoType, FilterInfoValue, getDateArray } from '@tianji/shared';
import { get, uniq } from 'lodash-es';
import { env } from '../../utils/env.js';
import { InsightsSqlBuilder } from './shared.js';

export class AIGatewayInsightsSqlBuilder extends InsightsSqlBuilder {
  getTableName() {
    return 'AIGatewayLogs';
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;
    return metrics.map((item) => {
      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return Prisma.sql`count(1) as "$all_event"`;
        }

        // For standard fields, directly count
        // TODO: maybe use other math functions
        if (
          ['inputToken', 'outputToken', 'ttft', 'price'].includes(item.name)
        ) {
          return Prisma.sql`sum("AIGatewayLogs"."${Prisma.raw(item.name)}") as ${Prisma.raw(`"${item.name}"`)}`;
        }
      } else if (item.math === 'sessions') {
        // AIGatewayLogs has no concept of sessions, but can be grouped by gatewayId
        if (item.name === '$all_event') {
          return Prisma.sql`count(distinct "gatewayId") as "$all_event"`;
        }
      }

      return Prisma.empty;
    });
  }

  buildWhereQueryArr() {
    const { insightId, time, filters } = this.query;
    const { startAt, endAt } = time;

    return [
      // gatewayId
      Prisma.sql`"AIGatewayLogs"."gatewayId" = ${insightId}`,

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
      const valueField = Prisma.sql`"AIGatewayLogs"."${Prisma.raw(name)}"${type === 'number' ? Prisma.empty : type === 'boolean' ? Prisma.empty : Prisma.empty}`;
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
      const valueField = Prisma.sql`("AIGatewayLogs"."requestPayload"->> '${field}')${type === 'number' ? Prisma.raw('::int') : type === 'boolean' ? Prisma.raw('::boolean') : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    } else if (name.startsWith('response.')) {
      const field = name.replace('response.', '');
      const valueField = Prisma.sql`("AIGatewayLogs"."responsePayload"->> '${field}')${type === 'number' ? Prisma.raw('::int') : type === 'boolean' ? Prisma.raw('::boolean') : Prisma.empty}`;
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        valueField
      );
    }

    return Prisma.sql`1 = 1`;
  }
}

export async function insightsAIGateway(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { time, metrics, groups } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const builder = new AIGatewayInsightsSqlBuilder(query, context);
  const sql = builder.build();

  if (env.isDev) {
    printSQL(sql);
  }

  const res = await prisma.$queryRaw<{ date: string | null }[]>(sql);

  let result: {
    name: string;
    [groupName: string]: any;
    data: {
      date: string;
      value: number;
    }[];
  }[] = [];

  for (const m of metrics) {
    if (groups.length > 0) {
      for (const g of groups) {
        const allGroupValue = uniq(
          res.map((item) => get(item, `%${g.value}`) as any)
        );

        result.push(
          ...allGroupValue.map((gv) => ({
            name: m.name,
            [g.value]: gv,
            data: getDateArray(
              res
                .filter((item) => get(item, `%${g.value}`) === gv)
                .map((item) => {
                  return {
                    value: Number(get(item, m.name)),
                    date: String(item.date),
                  };
                }),
              startAt,
              endAt,
              unit,
              timezone
            ),
          }))
        );
      }
    } else {
      result.push({
        name: m.name,
        data: getDateArray(
          res.map((item) => {
            return {
              value: Number(get(item, m.name)),
              date: String(item.date),
            };
          }),
          startAt,
          endAt,
          unit,
          timezone
        ),
      });
    }
  }

  return result;
}
