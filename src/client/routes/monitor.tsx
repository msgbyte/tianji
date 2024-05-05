import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { MonitorHealthBar } from '@/components/monitor/MonitorHealthBar';
import { Button } from '@/components/ui/button';
import { useDataReady } from '@/hooks/useDataReady';
import { useEvent } from '@/hooks/useEvent';
import { LayoutV2 } from '@/pages/LayoutV2';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { compact } from 'lodash-es';
import { LuPlus } from 'react-icons/lu';

export const Route = createFileRoute('/monitor')({
  beforeLoad: routeAuthBeforeLoad,
  component: MonitorComponent,
});

function MonitorComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [] } = trpc.monitor.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: (
      <MonitorHealthBar
        workspaceId={workspaceId}
        monitorId={item.id}
        showPercent={true}
        showCurrentStatus={true}
      />
    ),
    tags: compact([item.type, item.active ? false : t('Stopped')]),
    href: `/monitor/${item.id}`,
  }));

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        navigate({
          to: '/monitor/$monitorId',
          params: {
            monitorId: data[0].id,
          },
        });
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/monitor/add',
    });
  });

  return (
    <LayoutV2
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Monitor')}
              actions={
                <Button
                  className={cn(pathname === '/monitor/add' && '!bg-muted')}
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
