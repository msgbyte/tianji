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
import { Trans, useTranslation } from '@i18next-toolkit/react';
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
  const { data = [] } = trpc.survey.all.useQuery({
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
    <LayoutV2
      list={
        <CommonWrapper
          header={
            <CommonHeader
              title={t('Survey')}
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
