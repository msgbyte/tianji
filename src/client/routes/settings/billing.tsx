import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '../../api/trpc';
import { useCurrentWorkspace, useCurrentWorkspaceId } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import dayjs from 'dayjs';
import { formatNumber } from '@/utils/common';
import { UsageCard } from '@/components/UsageCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEvent } from '@/hooks/useEvent';
import { SubscriptionSelection } from '@/components/billing/SubscriptionSelection';

export const Route = createFileRoute('/settings/billing')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: currentTier } = trpc.billing.currentTier.useQuery({
    workspaceId,
  });
  const checkoutMutation = trpc.billing.checkout.useMutation({
    onError: defaultErrorHandler,
  });
  const changePlanMutation = trpc.billing.changePlan.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const cancelSubscriptionMutation =
    trpc.billing.cancelSubscription.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });

  const { data, refetch, isInitialLoading, isLoading } =
    trpc.billing.currentSubscription.useQuery({
      workspaceId,
    });

  const handleChangeSubscribe = useEvent(
    async (tier: 'free' | 'pro' | 'team') => {
      await changePlanMutation.mutateAsync({
        workspaceId,
        tier,
      });

      refetch();
    }
  );

  const plan = data ? (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          loading={changePlanMutation.isLoading}
          onClick={() => handleChangeSubscribe('free')}
        >
          Change plan to Free
        </Button>
        <Button
          loading={changePlanMutation.isLoading}
          onClick={() => handleChangeSubscribe('pro')}
        >
          Change plan to Pro
        </Button>
        <Button
          loading={changePlanMutation.isLoading}
          onClick={() => handleChangeSubscribe('team')}
        >
          Change plan to Team
        </Button>
      </div>

      <div>
        <Button
          loading={cancelSubscriptionMutation.isLoading}
          onClick={() =>
            cancelSubscriptionMutation.mutateAsync({
              workspaceId,
            })
          }
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <SubscriptionSelection tier={currentTier} />
    </div>
  );

  return (
    <CommonWrapper header={<CommonHeader title={t('Billing')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-2">
          <div>
            <div>Current: {JSON.stringify(data)}</div>

            <Button loading={isLoading} onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          <Separator className="my-2" />

          {isInitialLoading === false && plan}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
