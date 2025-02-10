import { getDateArray } from '@tianji/shared';
import {
  BaseQueryFilters,
  getDateQuery,
  QueryOptions,
} from '../utils/prisma.js';
import { prisma } from './_client.js';

export async function getSurveyStats(
  surveyId: string,
  filter: BaseQueryFilters,
  options: QueryOptions = {}
) {
  const { startDate, endDate } = filter;
  const { timezone = 'utc', unit = 'day' } = options;

  const results = await prisma.$queryRaw<{ date: string; count: BigInt }[]>`
    SELECT
      ${getDateQuery('"createdAt"', unit, timezone)} "date",
      count(*) "count"
    FROM
      "SurveyResult"
    WHERE
      "surveyId" = ${surveyId}
      and "createdAt" between ${startDate}::timestamptz and ${endDate}::timestamptz
    GROUP BY 1
  `;

  return getDateArray(
    results.map((res) => ({
      date: res.date,
      count: Number(res.count),
    })),
    startDate,
    endDate,
    unit,
    timezone
  );
}
