import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { get, uniq } from 'lodash-es';
import { getDateArray } from '@tianji/shared';

export const insightsSurveyBuiltinFields = [
  'aiCategory',
  'browser',
  'os',
  'language',
];

/**
 * Process the grouped time series data
 * @param query - The query object
 * @param context - The context object
 * @param data - The database result
 * @returns The processed data
 */
export function processGroupedTimeSeriesData(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string },
  data: { date: string | null }[]
) {
  const { time, metrics, groups } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

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
          data.map((item) => get(item, `%${g.value}`) as any)
        );

        result.push(
          ...allGroupValue.map((gv) => ({
            name: m.name,
            alias: m.alias,
            [g.value]: gv,
            data: getDateArray(
              data
                .filter((item) => get(item, `%${g.value}`) === gv)
                .map((item) => {
                  return {
                    value: Number(get(item, m.alias ?? m.name)),
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
        alias: m.alias,
        data: getDateArray(
          data.map((item) => {
            return {
              value: Number(get(item, m.alias ?? m.name)),
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
