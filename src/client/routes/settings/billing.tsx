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
import { LuRefreshCw } from 'react-icons/lu';
import { cn } from '@/utils/style';

export const Route = createFileRoute('/settings/billing')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: currentTier, refetch: refetchCurrendTier } =
    trpc.billing.currentTier.useQuery({
      workspaceId,
    });

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
