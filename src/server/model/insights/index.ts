import { z } from 'zod';
import {
  insightsQueryEventsSchema,
  insightsQuerySchema,
} from '../../utils/schema.js';
import { insightsWebsite, WebsiteInsightsSqlBuilder } from './website.js';
import { insightsSurvey } from './survey.js';
import { insightsAIGateway } from './aiGateway.js';
import { compact, omit } from 'lodash-es';
import { prisma } from '../_client.js';
import { insightsWarehouse } from './warehouse.js';
import { INIT_WORKSPACE_ID } from '../../utils/const.js';

export function queryInsight(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { insightType } = query;

  if (insightType === 'website') {
    return insightsWebsite(query, context);
  }

  if (insightType === 'survey') {
    return insightsSurvey(query, context);
  }

  if (insightType === 'aigateway') {
    return insightsAIGateway(query, context);
  }

  if (insightType === 'warehouse' && query.workspaceId === INIT_WORKSPACE_ID) {
    return insightsWarehouse(query, context);
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

  throw new Error('Unknown Insight Type');
}
