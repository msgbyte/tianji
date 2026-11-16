import { Prisma } from '@prisma/client';
import { prisma } from '../_client.js';
import type { BaseQueryFilters } from '../../utils/prisma.js';

export async function getApplicationRetention(
  applicationId: string,
  filters: BaseQueryFilters
) {
  const { startDate, endDate, timezone = 'UTC' } = filters;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  const retentionColumns = Prisma.join(
    Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      return Prisma.sql`
        case when cohorts.cohort_date + ${day}::integer < (current_timestamp at time zone ${timezone})::date
          then count(distinct activity.session_id) filter (where activity.activity_date = cohorts.cohort_date + ${day}::integer)::integer
        end ${Prisma.raw(`d${day}`)}`;
    })
  );
  const rows = await prisma.$queryRaw<
    {
      date: string;
      cohortSize: number;
      [key: string]: string | number | null;
    }[]
  >`
    with cohorts as (
      select
        "sessionId" session_id,
        (min("createdAt") at time zone ${timezone})::date cohort_date
      from "ApplicationEvent"
      where "applicationId" = ${applicationId}
        and "createdAt" <= ${endDate}::timestamptz
      group by "sessionId"
      having min("createdAt") between ${startDate}::timestamptz and ${endDate}::timestamptz
    ), activity as (
      select distinct
        "sessionId" session_id,
        ("createdAt" at time zone ${timezone})::date activity_date
      from "ApplicationEvent"
      where "applicationId" = ${applicationId}
        and "createdAt" >= ${startDate}::timestamptz
        and "createdAt" < least(
          ((((${endDate}::timestamptz at time zone ${timezone})::date + 31)::timestamp) at time zone ${timezone}),
          current_timestamp
        )
    )
    select
      to_char(cohorts.cohort_date, 'YYYY-MM-DD') date,
      count(distinct cohorts.session_id)::integer "cohortSize",
      ${retentionColumns}
    from cohorts
    left join activity on activity.session_id = cohorts.session_id
    group by cohorts.cohort_date
    order by cohorts.cohort_date desc
  `;

  return rows.map((row) => ({
    date: row.date,
    cohortSize: row.cohortSize,
    retention: [
      row.cohortSize,
      ...Array.from({ length: 30 }, (_, index) => {
        const value = row[`d${index + 1}`];
        return value === null || value === undefined ? null : Number(value);
      }),
    ],
  }));
}
