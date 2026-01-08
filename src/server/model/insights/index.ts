import { z } from 'zod';
import {
  insightsQueryEventsSchema,
  insightsQuerySchema,
} from '../../utils/schema.js';
import { insightsWebsite, WebsiteInsightsSqlBuilder } from './website.js';
import { insightsSurvey, SurveyInsightsSqlBuilder } from './survey.js';
import { insightsAIGateway } from './aiGateway.js';
import { compact, omit } from 'lodash-es';
import { prisma } from '../_client.js';
import { insightsLongTableWarehouse } from './warehouse/longTable.js';
import { INIT_WORKSPACE_ID } from '../../utils/const.js';
import { findWarehouseApplication } from './warehouse/utils.js';
import { insightsWideTableWarehouse } from './warehouse/wideTable.js';
import { queryWarehouseEvents } from './warehouse/index.js';

export async function queryInsight(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { insightType, metrics } = query;

  if (metrics.length === 0) {
    return [];
  }

  if (insightType === 'website') {
    return insightsWebsite(query, context);
  }

  if (insightType === 'survey') {
    return insightsSurvey(query, context);
  }

  if (insightType === 'aigateway') {
    return insightsAIGateway(query, context);
  }

  if (insightType === 'warehouse') {
    const application = await findWarehouseApplication(
      query.workspaceId,
      query.insightId
    );

    if (application?.type === 'wideTable') {
      return insightsWideTableWarehouse(query, context);
    }

    return insightsLongTableWarehouse(query, context);
  }

  throw new Error('Unknown Insight Type');
}

export async function queryEvents(
  query: z.infer<typeof insightsQueryEventsSchema>,
  context: { timezone: string }
) {
  const { insightType } = query;

  if (insightType === 'website') {
    const builder = new WebsiteInsightsSqlBuilder(query, context);

    const events = await builder.queryEvents(query.cursor);

    const sessionIds = compact(
      events.map((event) => event.properties.sessionId)
    );

    const sessions = await prisma.websiteSession.findMany({
      where: {
        id: {
          in: sessionIds,
        },
      },
      include: {
        sessionData: true,
      },
    });

    return events.map((event) => {
      const session = sessions.find(
        (session) => session.id === event.properties.sessionId
      );

      return {
        ...event,
        sessions: session
          ? {
              ...omit(session, ['sessionData']),
              ...session.sessionData.reduce(
                (acc, item) => {
                  acc[item.key] = item.numberValue ?? item.stringValue;
                  return acc;
                },
                {} as Record<string, any>
              ),
            }
          : null,
      };
    });
  }

  if (insightType === 'survey') {
    const builder = new SurveyInsightsSqlBuilder(query, {
      ...context,
      useClickhouse: false,
    });

    const events = await builder.queryEvents(query.cursor);

    return events.map((event) => ({
      ...event,
      sessions: null,
    }));
  }

  if (insightType === 'warehouse') {
    return queryWarehouseEvents(query, context);
  }

  throw new Error('Unknown Insight Type');
}
