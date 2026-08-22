import { trpc } from '@/api/trpc';
import { CommonList, CommonListItem } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { LuPlus } from 'react-icons/lu';
import { useEvent } from '@/hooks/useEvent';
import { useDataReady } from '@/hooks/useDataReady';
import { useMemo } from 'react';
import { WorkerSparkline } from '@/components/worker/WorkerSparkline';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/worker')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: workers = [], isLoading: isWorkersLoading } =
    trpc.worker.all.useQuery({
      workspaceId,
    });
  const { data: sharedModules = [], isLoading: isModulesLoading } =
    trpc.sharedModule.all.useQuery({
      workspaceId,
    });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const hasAdminPermission = useHasAdminPermission();
  const isSharedModules =
    pathname === '/worker/modules' || pathname.startsWith('/worker/modules/');

  const items: CommonListItem[] = useMemo(() => {
    if (isSharedModules) {
      return sharedModules.map((item) => ({
        id: item.id,
        title: item.name,
        href: `/worker/modules/${item.id}`,
        number: item._count.workerBindings,
      }));
    }

    return workers.length > 0
      ? workers.map((item) => ({
          id: item.id,
          title: item.name,
          href: `/worker/${item.id}`,
          content: <WorkerSparkline workerId={item.id} />,
        }))
      : [];
  }, [isSharedModules, sharedModules, workers]);

  useDataReady(
    () => (isSharedModules ? sharedModules.length > 0 : workers.length > 0),
    () => {
      if (pathname === Route.fullPath && workers[0]?.id) {
        navigate({
          to: '/worker/$workerId',
          params: {
            workerId: workers[0].id,
          },
        });
      } else if (pathname === '/worker/modules' && sharedModules[0]?.id) {
        navigate({
          to: '/worker/modules/$moduleId',
          params: {
            moduleId: sharedModules[0].id,
          },
        });
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: isSharedModules ? '/worker/modules/add' : '/worker/add',
    });
  });

  const handleSectionChange = useEvent((value: string) => {
    navigate({ to: value === 'modules' ? '/worker/modules' : '/worker' });
  });

  return (
    <Layout
      list={
        <CommonWrapper
          header={
            <div className="flex w-full min-w-0 items-center gap-2">
              <Tabs
                className="min-w-0 flex-1"
                value={isSharedModules ? 'modules' : 'workers'}
                onValueChange={handleSectionChange}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger className="min-w-0 px-2" value="workers">
                    <span className="truncate">{t('Workers')}</span>
                  </TabsTrigger>
                  <TabsTrigger className="min-w-0 px-2" value="modules">
                    <span className="truncate">{t('Modules')}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {hasAdminPermission && (
                <SimpleTooltip
                  content={
                    isSharedModules
                      ? t('Create Shared Module')
                      : t('Add Worker')
                  }
                >
                  <Button
                    aria-label={
                      isSharedModules
                        ? t('Create Shared Module')
                        : t('Add Worker')
                    }
                    className={cn(
                      'shrink-0',
                      (pathname === '/worker/add' ||
                        pathname === '/worker/modules/add') &&
                        '!bg-muted'
                    )}
                    variant="outline"
                    size="icon"
                    Icon={LuPlus}
                    onClick={handleClickAdd}
                  />
                </SimpleTooltip>
              )}
            </div>
          }
        >
          <CommonList
            hasSearch={true}
            items={items}
            direction="horizontal"
            isLoading={isSharedModules ? isModulesLoading : isWorkersLoading}
            emptyDescription={
              isSharedModules
                ? t('No shared modules yet.')
                : t(
                    'No function workers yet. Create one to run JavaScript code in an isolated environment.'
                  )
            }
          />
        </CommonWrapper>
      }
    />
  );
}
