import { WorkspaceSubscriptionTier } from '@prisma/client';
import { z } from 'zod';

export const TierLimitSchema = z.object({
  maxWebsiteCount: z.number(),
  maxWebsiteEventCount: z.number(),
  maxMonitorExecutionCount: z.number(),
  maxSurveyCount: z.number(),
  maxFeedChannelCount: z.number(),
  maxFeedEventCount: z.number(),
});

type TierLimit = z.infer<typeof TierLimitSchema>;

/**
 * Limit, Every month
 */
export function getTierLimit(tier: WorkspaceSubscriptionTier): TierLimit {
  if (tier === WorkspaceSubscriptionTier.FREE) {
    return {
      maxWebsiteCount: 3,
      maxWebsiteEventCount: 100_000,
      maxMonitorExecutionCount: 100_000,
      maxSurveyCount: 3,
      maxFeedChannelCount: 3,
      maxFeedEventCount: 10_000,
    };
  }

  if (tier === WorkspaceSubscriptionTier.PRO) {
    return {
      maxWebsiteCount: 10,
      maxWebsiteEventCount: 1_000_000,
      maxMonitorExecutionCount: 1_000_000,
      maxSurveyCount: 20,
      maxFeedChannelCount: 20,
      maxFeedEventCount: 100_000,
    };
  }

  if (tier === WorkspaceSubscriptionTier.TEAM) {
    return {
      maxWebsiteCount: -1,
      maxWebsiteEventCount: 20_000_000,
      maxMonitorExecutionCount: 20_000_000,
      maxSurveyCount: -1,
      maxFeedChannelCount: -1,
      maxFeedEventCount: 1_000_000,
    };
  }

  // Unlimited
  return {
    maxWebsiteCount: -1,
    maxWebsiteEventCount: -1,
    maxMonitorExecutionCount: -1,
    maxSurveyCount: -1,
    maxFeedChannelCount: -1,
    maxFeedEventCount: -1,
  };
}
