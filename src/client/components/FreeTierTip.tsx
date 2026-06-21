import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useTranslation } from '@i18next-toolkit/react';
import { LuArrowRight, LuInfo } from 'react-icons/lu';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate } from '@tanstack/react-router';
import { useLocalStorageState } from 'ahooks';
import { useGlobalConfig } from '@/hooks/useConfig';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import dayjs from 'dayjs';

interface FreeTierTipProps {
  isCollapsed: boolean;
}

const FREE_TIER_TIP_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

type FreeTierTipReason = 'free-tier-delay' | 'quota-exhausted';

interface BillingUsage {
  websiteEventCount?: number;
  monitorExecutionCount?: number;
  surveyCount?: number;
  feedEventCount?: number;
}

interface WorkspaceServiceCount {
  website?: number;
  survey?: number;
  feed?: number;
}

interface TierLimit {
  maxWebsiteCount?: number;
  maxWebsiteEventCount?: number;
  maxMonitorExecutionCount?: number;
  maxSurveyCount?: number;
  maxFeedChannelCount?: number;
  maxFeedEventCount?: number;
}

function isFiniteQuotaReached(current?: number, limit?: number) {
  return (
    typeof current === 'number' &&
    typeof limit === 'number' &&
    Number.isFinite(limit) &&
    limit >= 0 &&
    current >= limit
  );
}

function isQuotaExhausted(
  usage?: BillingUsage,
  serviceCount?: WorkspaceServiceCount,
  limit?: TierLimit
) {
  if (!usage || !serviceCount || !limit) {
    return false;
  }

  return (
    isFiniteQuotaReached(serviceCount.website, limit.maxWebsiteCount) ||
    isFiniteQuotaReached(usage.websiteEventCount, limit.maxWebsiteEventCount) ||
    isFiniteQuotaReached(
      usage.monitorExecutionCount,
      limit.maxMonitorExecutionCount
    ) ||
    isFiniteQuotaReached(
      serviceCount.survey ?? usage.surveyCount,
      limit.maxSurveyCount
    ) ||
    isFiniteQuotaReached(serviceCount.feed, limit.maxFeedChannelCount) ||
    isFiniteQuotaReached(usage.feedEventCount, limit.maxFeedEventCount)
  );
}

function getFreeTierTipReason(options: {
  firstOpenedAt: number;
  now: number;
  quotaExhausted: boolean;
  delayedTipIgnored: boolean;
  quotaTipIgnored: boolean;
}): FreeTierTipReason | null {
  const {
    firstOpenedAt,
    now,
    quotaExhausted,
    delayedTipIgnored,
    quotaTipIgnored,
  } = options;
  const delayedTipReady = now - firstOpenedAt >= FREE_TIER_TIP_DELAY_MS;

  if (quotaExhausted && !quotaTipIgnored) {
    return 'quota-exhausted';
  }

  if (delayedTipReady && !delayedTipIgnored) {
    return 'free-tier-delay';
  }

  return null;
}

export const FreeTierTip: React.FC<FreeTierTipProps> = React.memo((props) => {
  const { isCollapsed } = props;
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { enableBilling } = useGlobalConfig();
  const { data: currentTier } = trpc.billing.currentTier.useQuery(
    {
      workspaceId: workspaceId,
    },
    {
      enabled: enableBilling,
    }
  );
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [now] = React.useState(() => Date.now());
  const [startAt, endAt] = React.useMemo(
    () => [
      dayjs(now).startOf('month').valueOf(),
      dayjs(now).endOf('day').valueOf(),
    ],
    [now]
  );
  const shouldCheckQuota = enableBilling && currentTier === 'FREE';
  const { data: usage } = trpc.billing.usage.useQuery(
    {
      workspaceId,
      startAt,
      endAt,
    },
    {
      enabled: shouldCheckQuota,
    }
  );
  const { data: limit } = trpc.billing.limit.useQuery(
    {
      workspaceId,
    },
    {
      enabled: shouldCheckQuota,
    }
  );
  const { data: serviceCount } = trpc.workspace.getServiceCount.useQuery(
    {
      workspaceId,
    },
    {
      enabled: shouldCheckQuota,
    }
  );
  const firstOpenedAtKey = `tianji-free-tip-first-opened-at:${workspaceId}`;
  const delayedIgnoreKey = `tianji-free-tip-ignore:free-tier-delay:${workspaceId}`;
  const quotaIgnoreKey = `tianji-free-tip-ignore:quota-exhausted:${workspaceId}`;
  const [firstOpenedAt, setFirstOpenedAt] =
    useLocalStorageState<number>(firstOpenedAtKey);
  const [delayedTipIgnored, setDelayedTipIgnored] = useLocalStorageState(
    delayedIgnoreKey,
    {
      defaultValue: false,
    }
  );
  const [quotaTipIgnored, setQuotaTipIgnored] = useLocalStorageState(
    quotaIgnoreKey,
    {
      defaultValue: false,
    }
  );

  React.useEffect(() => {
    if (!shouldCheckQuota) {
      return;
    }

    if (typeof firstOpenedAt !== 'number' || !Number.isFinite(firstOpenedAt)) {
      setFirstOpenedAt(now);
    }
  }, [firstOpenedAt, now, setFirstOpenedAt, shouldCheckQuota]);

  const safeFirstOpenedAt =
    typeof firstOpenedAt === 'number' && Number.isFinite(firstOpenedAt)
      ? firstOpenedAt
      : now;
  const tipReason = getFreeTierTipReason({
    firstOpenedAt: safeFirstOpenedAt,
    now,
    quotaExhausted: isQuotaExhausted(usage, serviceCount, limit),
    delayedTipIgnored: delayedTipIgnored === true,
    quotaTipIgnored: quotaTipIgnored === true,
  });

  function ignoreCurrentTip() {
    if (tipReason === 'quota-exhausted') {
      setQuotaTipIgnored(true);
      return;
    }

    setDelayedTipIgnored(true);
  }

  const [legacyIgnored] = useLocalStorageState('tianji-free-tip-ignore', {
    defaultValue: false,
  });

  if (!enableBilling) {
    return null;
  }

  if (currentTier !== 'FREE') {
    return null;
  }

  if (isMobile) {
    return null;
  }

  if (legacyIgnored == true && tipReason === 'free-tier-delay') {
    return null;
  }

  if (!tipReason) {
    return null;
  }

  const card = (
    <Alert>
      <LuInfo className="h-4 w-4" />
      <AlertTitle>{t('Tip')}</AlertTitle>
      <AlertDescription>
        {t(
          'You are currently using the FREE plan. Upgrade to a higher plan to get more quota.'
        )}
      </AlertDescription>

      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            ignoreCurrentTip();
          }}
        >
          {t('Ignore')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          iconType="right"
          Icon={LuArrowRight}
          onClick={() => {
            navigate({
              to: '/settings/billing',
            });
          }}
        >
          {t('Billing')}
        </Button>
      </div>
    </Alert>
  );

  if (isCollapsed) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button Icon={LuInfo} variant="outline" size="icon" />
        </PopoverTrigger>
        <PopoverContent asChild>{card}</PopoverContent>
      </Popover>
    );
  }

  return card;
});
FreeTierTip.displayName = 'FreeTierTip';
