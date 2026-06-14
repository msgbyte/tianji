import { AppRouterOutput, defaultErrorHandler, trpc } from '@/api/trpc';
import { AIRouterLogTable } from '@/components/aiRouter/AIRouterLogTable';
import { AIRouterRouteEditor } from '@/components/aiRouter/AIRouterRouteEditor';
import { AIRouterUsageBtn } from '@/components/aiRouter/AIRouterUsageBtn';
import { AlertConfirm } from '@/components/AlertConfirm';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { message } from 'antd';
import dayjs from 'dayjs';
import { LuPencil, LuTrash } from 'react-icons/lu';

export const Route = createFileRoute('/aiRouter/$routerId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { routerId } = Route.useParams<{ routerId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: router, isLoading } = trpc.aiRouter.info.useQuery({
    workspaceId,
    routerId,
  });
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const trpcUtils = trpc.useUtils();

  const deleteMutation = trpc.aiRouter.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const handleDeleteRouter = useEvent(async () => {
    await deleteMutation.mutateAsync({
      workspaceId,
      routerId,
    });

    await trpcUtils.aiRouter.all.invalidate({
      workspaceId,
    });

    message.success(t('Delete Success'));

    navigate({
      to: '/aiRouter',
      replace: true,
    });
  });

  if (!routerId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!router) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={router.name}
          desc={router.enabled ? t('Enabled') : t('Disabled')}
          actions={
            <div className="space-x-2">
              <AIRouterUsageBtn routerId={routerId} />

              {hasAdminPermission && (
                <>
                <Button
                  size="icon"
                  variant="outline"
                  Icon={LuPencil}
                  aria-label={t('Edit AI Router')}
                  onClick={() =>
                    navigate({
                      to: '/aiRouter/$routerId/edit',
                      params: {
                        routerId,
                      },
                    })
                  }
                />

                <AlertConfirm
                  title={t('Delete AI Router') + ' ' + router.name}
                  description={t(
                    'Are you sure you want to delete this AI Router? This action cannot be undone.'
                  )}
                  onConfirm={handleDeleteRouter}
                >
                  <Button
                    size="icon"
                    variant="outline"
                    Icon={LuTrash}
                    aria-label={t('Delete AI Router')}
                  />
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
            <TabsTrigger value="routes">{t('Routes')}</TabsTrigger>
            <TabsTrigger value="logs">{t('Logs')}</TabsTrigger>
            <TabsTrigger value="settings">{t('Settings')}</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-4 w-full flex-1 overflow-hidden"
          >
            <div className="h-full overflow-auto">
              <Overview router={router} />
            </div>
          </TabsContent>

          <TabsContent
            value="routes"
            className="mt-4 w-full flex-1 overflow-hidden"
          >
            <div className="h-full overflow-auto">
              <AIRouterRouteEditor
                routerId={routerId}
                tiers={router.tiers}
                canEdit={hasAdminPermission}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="logs"
            className="mt-4 w-full flex-1 overflow-hidden"
          >
            <div className="h-full overflow-auto">
              <AIRouterLogTable routerId={routerId} />
            </div>
          </TabsContent>

          <TabsContent
            value="settings"
            className="mt-4 w-full flex-1 overflow-hidden"
          >
            <div className="h-full overflow-auto">
              <Settings router={router} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CommonWrapper>
  );
}

type AIRouterInfo = NonNullable<AppRouterOutput['aiRouter']['info']>;

function Overview({ router }: { router: AIRouterInfo }) {
  const { t } = useTranslation();
  const nodes = router.tiers.flatMap((tier) => tier.nodes);
  const enabledNodes = nodes.filter((node) => node.enabled).length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryItem
          label={t('Status')}
          value={router.enabled ? t('Enabled') : t('Disabled')}
        />
        <SummaryItem
          label={t('Active Nodes')}
          value={`${enabledNodes}/${nodes.length}`}
        />
        <SummaryItem
          label={t('Created At')}
          value={dayjs(router.createdAt).format('YYYY-MM-DD HH:mm')}
        />
        <SummaryItem
          label={t('Updated At')}
          value={dayjs(router.updatedAt).format('YYYY-MM-DD HH:mm')}
        />
      </div>

      <section className="overflow-hidden rounded-md border">
        <div className="bg-muted/30 border-b px-3 py-2 text-sm font-semibold">
          {t('Tiers')}
        </div>
        <div className="divide-y">
          {router.tiers.length === 0 ? (
            <div className="text-muted-foreground px-3 py-3 text-sm">
              {t('No tier configured yet.')}
            </div>
          ) : (
            router.tiers.map((tier, index) => (
              <div
                key={tier.id}
                className="grid gap-2 px-3 py-2 text-sm md:grid-cols-[minmax(0,1fr)_120px_120px]"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {t('Tier')} {index + 1}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {t('Weighted routing')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">
                    {t('Nodes')}
                  </div>
                  <div className="font-medium">{tier.nodes.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">
                    {t('Enabled')}
                  </div>
                  <div className="font-medium">
                    {tier.nodes.filter((node) => node.enabled).length}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Settings({
  router,
}: {
  router: AIRouterInfo;
}) {
  const { t } = useTranslation();
  const nodeCount = router.tiers.reduce(
    (sum, tier) => sum + tier.nodes.length,
    0
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryItem
          label={t('Router ID')}
          value={<span className="font-mono text-xs">{router.id}</span>}
        />
        <SummaryItem
          label={t('Status')}
          value={router.enabled ? t('Enabled') : t('Disabled')}
        />
        <SummaryItem label={t('Tier Count')} value={router.tiers.length} />
        <SummaryItem label={t('Node Count')} value={nodeCount} />
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}
