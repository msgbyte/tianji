import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { useDataReady } from '@/hooks/useDataReady';
import { useEvent } from '@/hooks/useEvent';
import { Layout } from '@/components/layout';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { LuPlus } from 'react-icons/lu';

export const Route = createFileRoute('/survey')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [], isLoading } = trpc.survey.all.useQuery({
    workspaceId,
  });
  const { data: allResultCount = {} } = trpc.survey.allResultCount.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items = data.map((item) => ({
    id: item.id,
    title: item.name,
    number: allResultCount[item.id] ?? 0,
    href: `/survey/${item.id}`,
  }));

  useDataReady(
    () => data.length > 0,
    () => {
      if (pathname === Route.fullPath) {
        navigate({
          to: '/survey/$surveyId',
          params: {
            surveyId: data[0].id,
          },
        });
      }
    }
  );

  const handleClickAdd = useEvent(() => {
    navigate({
      to: '/survey/add',
    });
  });

  return (
    <Layout
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Survey')}
              actions={
                <Button
                  className={cn(pathname === '/survey/add' && '!bg-muted')}
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
          <CommonList
            hasSearch={true}
            items={items}
            isLoading={isLoading}
            emptyDescription={t(
              'Not have any survey yet, create a survey to collect user feedback about your user service.'
            )}
          />
        </CommonWrapper>
      }
    />
  );
}
