import { createFileRoute } from '@tanstack/react-router';
import { AIGatewayLogTable } from '@/components/aiGateway/AIGatewayLogTable';
import { AIGatewayOverview } from '@/components/aiGateway/AIGatewayOverview';
import { AIGatewayCodeExampleBtn } from '@/components/aiGateway/AIGatewayCodeExampleBtn';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { AlertConfirm } from '@/components/AlertConfirm';
import { Button } from '@/components/ui/button';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommonHeader } from '@/components/CommonHeader';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useNavigate } from '@tanstack/react-router';
import { LuPencil, LuTrash, LuRefreshCw, LuSearch } from 'react-icons/lu';
import { message } from 'antd';
import { NotFoundTip } from '@/components/NotFoundTip';
import { useEvent } from '@/hooks/useEvent';
import { useWatch } from '@/hooks/useWatch';
import { useDebounce } from 'ahooks';

export const Route = createFileRoute('/aiGateway/$gatewayId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { gatewayId } = Route.useParams<{ gatewayId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const [_searchLogId, setSearchLogId] = useState<string>('');
  const searchLogId = useDebounce(_searchLogId);
  const { data: gateway, isLoading } = trpc.aiGateway.info.useQuery({
    workspaceId,
    gatewayId,
  });
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const trpcUtils = trpc.useUtils();

  const deleteMutation = trpc.aiGateway.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const handleDeleteGateway = useEvent(async () => {
    message.success(t('Delete Success'));

    await deleteMutation.mutateAsync({
      workspaceId,
      gatewayId,
    });

    await trpcUtils.aiGateway.all.refetch({ workspaceId });

    navigate({
      to: '/aiGateway',
      replace: true,
    });
  });

  if (!gatewayId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!gateway) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={gateway.name}
          actions={
            <div className="space-x-2">
              <AIGatewayCodeExampleBtn gatewayId={gatewayId} />

              {hasAdminPermission && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    Icon={LuPencil}
                    onClick={() =>
                      navigate({
                        to: '/aiGateway/$gatewayId/edit',
                        params: {
                          gatewayId,
                        },
                      })
                    }
                  />

                  <AlertConfirm
                    title={t('Delete AI Gateway') + ' ' + gateway.name}
                    description={t(
                      'Are you sure you want to delete this AI Gateway? This action cannot be undone.'
                    )}
                    onConfirm={handleDeleteGateway}
                  >
                    <Button size="icon" variant="outline" Icon={LuTrash} />
                  </AlertConfirm>
                </>
              )}
            </div>
          }
        />
      }
    >
      <div className="h-full overflow-hidden p-4">
        <Tabs
          defaultValue="overview"
          className="flex h-full w-full flex-col items-start"
        >
          <TabsList>
            <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
            <TabsTrigger value="logs">{t('Logs')}</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-4 w-full flex-1 space-y-4 overflow-hidden"
          >
            <div className="flex h-full w-full flex-col overflow-auto rounded-lg border p-4">
              <AIGatewayOverview gatewayId={gatewayId} />
            </div>
          </TabsContent>

          <TabsContent
            value="logs"
            className="mt-4 w-full flex-1 space-y-4 overflow-hidden"
          >
            <div className="flex h-full w-full flex-col overflow-auto rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('Gateway Logs')}</h3>
                <div className="flex items-center space-x-2">
                  <ManualRefreshButton
                    gatewayId={gatewayId}
                    logId={searchLogId || undefined}
                  />
                  <RealtimeUpdateButton
                    gatewayId={gatewayId}
                    logId={searchLogId || undefined}
                  />
                </div>
              </div>
              <div className="mb-4 flex items-center space-x-2">
                <div className="relative max-w-xs">
                  <LuSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('Search by Log ID')}
                    value={_searchLogId}
                    onChange={(e) => setSearchLogId(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <AIGatewayLogTable
                gatewayId={gatewayId}
                logId={searchLogId || undefined}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CommonWrapper>
  );
}

interface RealtimeUpdateButtonProps {
  gatewayId: string;
  logId?: string;
}

interface ManualRefreshButtonProps {
  gatewayId: string;
  logId?: string;
}

function ManualRefreshButton({ gatewayId, logId }: ManualRefreshButtonProps) {
  const workspaceId = useCurrentWorkspaceId();
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useEvent(async () => {
    setIsRefreshing(true);
    try {
      await utils.aiGateway.logs.refetch({
        workspaceId,
        gatewayId,
        logId,
      });
    } finally {
      setIsRefreshing(false);
    }
  });

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={isRefreshing}
      Icon={LuRefreshCw}
      loading={isRefreshing}
    />
  );
}

function RealtimeUpdateButton({ gatewayId, logId }: RealtimeUpdateButtonProps) {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [isRealtime, setIsRealtime] = useState(false);
  const utils = trpc.useUtils();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useWatch([isRealtime, gatewayId, logId], () => {
    if (isRealtime) {
      timerRef.current = setInterval(() => {
        utils.aiGateway.logs.invalidate({
          workspaceId,
          gatewayId,
          logId,
        });
      }, 4000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  });

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="realtime-mode"
        checked={isRealtime}
        onCheckedChange={setIsRealtime}
      />
      <Label htmlFor="realtime-mode">{t('Realtime Update')}</Label>
    </div>
  );
}
