import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { insightsWebsite, WebsiteInsightsSqlBuilder } from './website.js';
import { insightsSurvey } from './survey.js';
import { insightsAIGateway } from './aiGateway.js';
import { compact, omit } from 'lodash-es';
import { prisma } from '../_client.js';

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

  throw new Error('Unknown Insight Type');
}

export async function queryEvents(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { insightType } = query;

  if (insightType === 'website') {
    const builder = new WebsiteInsightsSqlBuilder(query, context);

    const events = await builder.queryEvents();

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
              ...session.sessionData,
            }
          : null,
      };
    });
  }

  throw new Error('Unknown Insight Type');
}
