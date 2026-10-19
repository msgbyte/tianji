import { z } from 'zod';
import { insightsQueryEventsSchema } from '../../../utils/schema.js';
import { WarehouseLongTableInsightsSqlBuilder } from './longTable.js';
import { findWarehouseApplication } from './utils.js';
import { WarehouseWideTableInsightsSqlBuilder } from './wideTable.js';

export async function queryWarehouseEvents(
  query: z.infer<typeof insightsQueryEventsSchema>,
  context: { timezone: string }
) {
  const application = await findWarehouseApplication(
    query.workspaceId,
    query.insightId
  );

  const builder =
    application?.type === 'wideTable'
      ? new WarehouseWideTableInsightsSqlBuilder(query, context)
      : new WarehouseLongTableInsightsSqlBuilder(query, context);

  await builder.initialize();
  return builder.queryEvents(query.cursor);
}
