import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { insightsWebsite, WebsiteInsightsSqlBuilder } from './website.js';
import { insightsSurvey } from './survey.js';
import { insightsAIGateway } from './aiGateway.js';

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

export function queryEvents(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { insightType } = query;

  if (insightType === 'website') {
    const builder = new WebsiteInsightsSqlBuilder(query, context);

    return builder.queryEvents();
  }

  throw new Error('Unknown Insight Type');
}
