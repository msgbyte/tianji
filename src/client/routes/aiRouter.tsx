import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList, CommonListItem } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useDataReady } from '@/hooks/useDataReady';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useMemo } from 'react';
import { LuPlus } from 'react-icons/lu';

export const Route = createFileRoute('/aiRouter')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIRouterComponent,
});

function AIRouterComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.aiRouter.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items: CommonListItem[] = useMemo(() => {
    return data.map((item) => ({
      id: item.id,
      title: item.name,
      href: `/aiRouter/${item.id}`,
      content: item.enabled ? t('Enabled') : t('Disabled'),
      tags: [item.enabled ? t('Enabled') : t('Disabled')],
    }));
  }, [data, t]);

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/aiRouter/add',
    });
  });

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath && data.length > 0) {
        navigate({
          to: '/aiRouter/$routerId',
          params: {
            routerId: data[0].id,
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
              title={t('AI Router')}
              actions={
                hasAdminPermission && (
                  <Button
                    className={cn(pathname === '/aiRouter/add' && '!bg-muted')}
                    variant="outline"
                    Icon={LuPlus}
                    onClick={handleClickAdd}
                  >
                    {t('Add')}
                  </Button>
                )
              }
            />
          }
        >
          <CommonList
            hasSearch={true}
            items={items}
            direction="horizontal"
            isLoading={isLoading}
            emptyDescription={t(
              'No AI Router has been added yet. You can create one to fail over across AI Gateways.'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
