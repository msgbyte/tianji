import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { AlertConfirm } from '@/components/AlertConfirm';
import { message } from 'antd';
import { NotFoundTip } from '@/components/NotFoundTip';
import { useEvent } from '@/hooks/useEvent';
import { AIGatewayLogTable } from '@/components/aiGateway/AIGatewayLogTable';
import { ScrollAreaScrollbar } from '@radix-ui/react-scroll-area';
import { AIGatewayOverview } from '@/components/aiGateway/AIGatewayOverview';

export const Route = createFileRoute('/aiGateway/$gatewayId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { gatewayId } = Route.useParams<{ gatewayId: string }>();
  const workspaceId = useCurrentWorkspaceId();
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
              <h3 className="mb-2 text-lg font-medium">{t('Gateway Logs')}</h3>
              <AIGatewayLogTable gatewayId={gatewayId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CommonWrapper>
  );
}
