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
import { useMemo } from 'react';
import { AIGatewaySparkline } from '@/components/aiGateway/AIGatewaySparkline';
import { AIGatewayPricingBtn } from '@/components/aiGateway/AIGatewayPricingBtn';

export const Route = createFileRoute('/aiGateway')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIGatewayComponent,
});

function AIGatewayComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.aiGateway.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items: CommonListItem[] = useMemo(() => {
    return data.length > 0
      ? data.map((item) => ({
          id: item.id,
          title: item.name,
          href: `/aiGateway/${item.id}`,
          content: <AIGatewaySparkline gatewayId={item.id} />,
        }))
      : [];
  }, [data]);

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/aiGateway/add',
    });
  });

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath && data.length > 0) {
        navigate({
          to: '/aiGateway/$gatewayId',
          params: {
            gatewayId: data[0].id,
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
              title={t('AI Gateway')}
              actions={
                <div className="space-x-2">
                  <AIGatewayPricingBtn />

                  {hasAdminPermission && (
                    <Button
                      className={cn(
                        pathname === '/aiGateway/add' && '!bg-muted'
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
            direction="horizontal"
            isLoading={isLoading}
            emptyDescription={t(
              'No AI Gateway has been added yet. You can create one to integrate with external AI services.'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
