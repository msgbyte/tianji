import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { NotFoundTip } from '@/components/NotFoundTip';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MonitorStatusPageEditForm,
  MonitorStatusPageEditFormValues,
} from '@/components/monitor/StatusPage/EditForm';

export const Route = createFileRoute('/page/$slug/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageEditComponent,
});

function PageEditComponent() {
  const { t } = useTranslation();
  const { slug } = Route.useParams<{ slug: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: pageInfo, isLoading } = trpc.page.getPageInfo.useQuery({
    slug,
  });

  const editPageMutation = trpc.page.editPage.useMutation({
    onError: defaultErrorHandler,
  });

  const handleSubmit = useEvent(
    async (values: MonitorStatusPageEditFormValues) => {
      if (!pageInfo) {
        return;
      }

      const res = await editPageMutation.mutateAsync({
        ...values,
        id: pageInfo.id,
        workspaceId: pageInfo.workspaceId,
      });

      utils.page.getAllPages.refetch();
      utils.page.getPageInfo.refetch({ slug: res.slug });

      navigate({
        to: '/page/$slug',
        params: {
          slug: res.slug,
        },
        replace: true,
      });
    }
  );

  if (!slug) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!pageInfo) {
    return <NotFoundTip />;
  }

  const initialValues: Partial<MonitorStatusPageEditFormValues> = {
    type: pageInfo.type,
    title: pageInfo.title,
    slug: pageInfo.slug,
    description: pageInfo.description ?? '',
    domain: pageInfo.domain ?? '',
    body: (pageInfo as any).body ?? { groups: [] },
    monitorList: (pageInfo as any).monitorList ?? [],
    payload: (pageInfo as any).payload ?? { html: '' },
  };

  return (
    <CommonWrapper
      header={<CommonHeader title={pageInfo.title} desc={t('Edit')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <MonitorStatusPageEditForm
              initialValues={initialValues}
              isLoading={editPageMutation.isPending}
              onFinish={handleSubmit}
            />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
