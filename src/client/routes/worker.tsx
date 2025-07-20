import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
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

export const Route = createFileRoute('/worker')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.worker.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const hasAdminPermission = useHasAdminPermission();

  const items = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: item.description || '',
    href: `/worker/${item.id}`,
  }));

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        window.location.href = `/worker/${data[0].id}`;
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/worker/add',
    });
  });

  return (
    <Layout
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Function Worker')}
              actions={
                <>
                  {hasAdminPermission && (
                    <Button
                      className={cn(pathname === '/worker/add' && '!bg-muted')}
                      variant="outline"
                      Icon={LuPlus}
                      onClick={handleClickAdd}
                    >
                      {t('Add')}
                    </Button>
                  )}
                </>
              }
            />
          }
        >
          <CommonList
            hasSearch={true}
            items={items}
            isLoading={isLoading}
            emptyDescription={t(
              'No function workers yet. Create one to run JavaScript code in an isolated environment.'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
