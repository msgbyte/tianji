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
import { LuPlus } from 'react-icons/lu';
import { useDataReady } from '@/hooks/useDataReady';

export const Route = createFileRoute('/application')({
  beforeLoad: routeAuthBeforeLoad,
  component: ApplicationComponent,
});

function ApplicationComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.application.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items: CommonListItem[] = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: new Date(item.createdAt).toLocaleString(),
    href: `/application/${item.id}`,
  }));

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/application/add',
    });
  });

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        navigate({
          to: '/application/$applicationId',
          params: {
            applicationId: data[0].id,
          },
        });
      }
    }
  );

  return (
    <Layout
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Application')}
              actions={
                <div className="space-x-2">
                  {hasAdminPermission && (
                    <Button
                      className={cn(
                        pathname === '/application/add' && '!bg-muted'
                      )}
                      variant="outline"
                      Icon={LuPlus}
                      onClick={handleClickAdd}
                    >
                      {t('Add')}
                    </Button>
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
              'Not any application has been added, you can add your application and integrate with Tianji to get more information.'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
