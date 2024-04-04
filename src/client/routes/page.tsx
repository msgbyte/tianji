import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { useDataReady } from '@/hooks/useDataReady';
import { useEvent } from '@/hooks/useEvent';
import { LayoutV2 } from '@/pages/LayoutV2';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { LuPlus } from 'react-icons/lu';

export const Route = createFileRoute('/page')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [] } = trpc.monitor.getAllPages.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items = data.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.slug,
    href: `/page/${item.slug}`,
  }));

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        navigate({
          to: '/page/$slug',
          params: {
            slug: data[0].slug,
          },
        });
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/page/add',
    });
  });

  return (
    <LayoutV2
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Pages')}
              actions={
                <Button
                  variant="outline"
                  Icon={LuPlus}
                  onClick={handleClickAdd}
                >
                  {t('Add')}
                </Button>
              }
            />
          }
        >
          <CommonList hasSearch={true} items={items} />
        </CommonWrapper>
      }
    />
  );
}
