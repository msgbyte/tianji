import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList, CommonListItem } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
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
import { useEffect } from 'react';
import { LuEye, LuPlus } from 'react-icons/lu';
import { InsightsStoreProvider } from '@/store/insights';

export const Route = createFileRoute('/website')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteComponent,
});

function WebsiteComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.website.all.useQuery({
    workspaceId,
  });
  const { data: overviewData = {} } = trpc.website.allOverview.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items: CommonListItem[] = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: item.domain,
    number: overviewData[item.id] ?? 0,
    href: `/website/${item.id}`,
  }));

  useEffect(() => {
    if (pathname === Route.fullPath) {
      navigate({
        to: '/website/overview',
      });
    }
  }, []);

  const handleClickOverview = useEvent(() => {
    navigate({
      to: '/website/overview',
    });
  });

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/website/add',
    });
  });

  return (
    // Temporarily add InsightsStoreProvider to resolve conflict issues
    <InsightsStoreProvider>
      <Layout
        list={
          <CommonWrapper
            header={
              <CommonHeader
                title={t('Website')}
                actions={
                  <div className="space-x-2">
                    <Button
                      className={cn(
                        pathname === '/website/overview' && '!bg-muted'
                      )}
                      variant="outline"
                      Icon={LuEye}
                      onClick={handleClickOverview}
                    >
                      {t('Overview')}
                    </Button>

                    {hasAdminPermission && (
                      <Button
                        className={cn(
                          pathname === '/website/add' && '!bg-muted'
                        )}
                        variant="outline"
                        size="icon"
                        Icon={LuPlus}
                        onClick={handleClickAdd}
                      />
                    )}
                  </div>
                }
              />
            }
          >
            <CommonList
              hasSearch={true}
              items={items}
              isLoading={isLoading}
              emptyDescription={t(
                'Not any website has been added, you can add your website and integrate with Tianji to get more information.'
              )}
            />
          </CommonWrapper>
        }
      />
    </InsightsStoreProvider>
  );
}
