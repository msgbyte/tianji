import { useMemo } from 'react';
import { get } from 'lodash-es';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCheck, LuRefreshCw } from 'react-icons/lu';

import { routeAuthBeforeLoad } from '@/utils/route';
import { getUrlQueryParams } from '@/utils/url';
import { cn } from '@/utils/style';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { CreditBalanceCard } from '@/components/billing/CreditBalanceCard';
import { CreditRecharge } from '@/components/billing/CreditRecharge';
import { SubscriptionSelection } from '@/components/billing/SubscriptionSelection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventWithLoading } from '@/hooks/useEvent';
import { useGlobalConfig } from '@/hooks/useConfig';
import { trpc } from '../../../api/trpc';
import { useCurrentWorkspaceId } from '../../../store/user';

export const Route = createFileRoute('/settings/billing/')({
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

  const { enableAI } = useGlobalConfig();

  const {
    data,
    refetch: refetchCurrendSubscription,
    isInitialLoading,
  } = trpc.billing.currentSubscription.useQuery({
    workspaceId,
  });

  const creditRefetchInterval = isRechargeCallback ? 5000 : undefined;
  const trpcUtils = trpc.useUtils();

  const [handleRefresh, isRefreshing] = useEventWithLoading(async () => {
    await Promise.all([
      // refresh all info
      refetchCurrendSubscription(),
      refetchCurrendTier(),
      trpcUtils.billing.credit.invalidate({ workspaceId }),
    ]);

    setTimeout(() => {
      Promise.all([
        // refresh all info
        refetchCurrendSubscription(),
        refetchCurrendTier(),
        trpcUtils.billing.credit.invalidate({ workspaceId }),
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
                {t('It maybe take effect in a few minutes.')}
              </AlertDescription>
            </Alert>
          )}

          {enableAI && (
            <CreditBalanceCard
              className="mb-2"
              refetchInterval={creditRefetchInterval}
            />
          )}

          {isInitialLoading === false && (
            <Tabs defaultValue="subscription" className="flex flex-col gap-4">
              <TabsList className="w-fit">
                {enableAI && (
                  <TabsTrigger value="recharge">
                    {t('Purchase Credits')}
                  </TabsTrigger>
                )}

                <TabsTrigger value="subscription">
                  {t('Subscription Plan')}
                </TabsTrigger>
              </TabsList>

              {enableAI && (
                <TabsContent
                  value="recharge"
                  className="mt-2 flex flex-col gap-6"
                >
                  <CreditRecharge onSuccess={handleRefresh} />
                </TabsContent>
              )}

              <TabsContent value="subscription" className="mt-2">
                <SubscriptionSelection
                  currentTier={currentTier}
                  alreadySubscribed={
                    Boolean(data) && data?.status !== 'cancelled'
                  }
                  onRefresh={handleRefresh}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
