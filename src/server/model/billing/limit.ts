import { WorkspaceSubscriptionTier } from '@prisma/client';

interface TierLimit {
  maxWebsiteCount: number;
  maxWebsiteEventCount: number;
  maxMonitorExecutionCount: number;
  maxSurveyCount: number;
  maxFeedChannelCount: number;
  maxFeedEventCount: number;
}

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
