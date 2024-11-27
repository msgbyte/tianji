import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { Button } from '@/components/ui/button';
import { useEventWithLoading } from '@/hooks/useEvent';
import { SubscriptionSelection } from '@/components/billing/SubscriptionSelection';
import { LuCheck, LuRefreshCw } from 'react-icons/lu';
import { cn } from '@/utils/style';
import { useMemo } from 'react';
import { getUrlQueryParams } from '@/utils/url';
import { get } from 'lodash-es';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const Route = createFileRoute('/settings/billing')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const isRechargeCallback = useMemo(
    () => get(getUrlQueryParams(location.href), 'status') === 'success',
    []
  );

  const { data: currentTier, refetch: refetchCurrendTier } =
    trpc.billing.currentTier.useQuery(
      {
        workspaceId,
      },
      {
        refetchInterval: isRechargeCallback ? 5000 : undefined,
      }
    );

  const {
    data,
    refetch: refetchCurrendSubscription,
    isInitialLoading,
  } = trpc.billing.currentSubscription.useQuery({
    workspaceId,
  });

  const [handleRefresh, isRefreshing] = useEventWithLoading(async () => {
    await Promise.all([
      // refresh all info
      refetchCurrendSubscription(),
      refetchCurrendTier(),
    ]);

    setTimeout(() => {
      Promise.all([
        // refresh all info
        refetchCurrendSubscription(),
        refetchCurrendTier(),
      ]);
    }, 5000);
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Billing')}
          actions={
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRefresh()}
              >
                <LuRefreshCw className={cn(isRefreshing && 'animate-spin')} />
              </Button>
            </>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-2">
          {isRechargeCallback && (
            <Alert className="mb-4" variant="success">
              <LuCheck className="h-4 w-4" />
              <AlertTitle>{t('Subscription Recharge Successful')}</AlertTitle>
              <AlertDescription>
                {t('It will take effect in a few minutes.')}
              </AlertDescription>
            </Alert>
          )}

          {isInitialLoading === false && (
            <div className="flex gap-2">
              <SubscriptionSelection
                currentTier={currentTier}
                alreadySubscribed={
                  Boolean(data) && data?.status !== 'cancelled'
                }
                onRefresh={handleRefresh}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
