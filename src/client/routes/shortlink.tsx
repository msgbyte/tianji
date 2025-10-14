import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { useDataReady } from '@/hooks/useDataReady';
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
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/shortlink')({
  beforeLoad: routeAuthBeforeLoad,
  component: ShortLinkComponent,
});

function ShortLinkComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.shortlink.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const hasAdminPermission = useHasAdminPermission();

  const items = data.map((item) => ({
    id: item.id,
    title: item.title || item.code,
    content: (
      <div className="text-muted-foreground truncate text-xs">
        {item.originalUrl}
      </div>
    ),
    tags: [
      item.enabled ? (
        <Badge key="enabled" variant="default" className="text-xs">
          {t('Enabled')}
        </Badge>
      ) : (
        <Badge key="disabled" variant="secondary" className="text-xs">
          {t('Disabled')}
        </Badge>
      ),
    ],
    href: `/shortlink/${item.id}`,
  }));

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        navigate({
          to: '/shortlink/$shortLinkId',
          params: {
            shortLinkId: data[0].id,
          },
        });
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/shortlink/add',
    });
  });

  return (
    <Layout
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Short Link')}
              actions={
                <>
                  {hasAdminPermission && (
                    <Button
                      className={cn(
                        pathname === '/shortlink/add' && '!bg-muted'
                      )}
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
              'No short links yet, create one to get started'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
