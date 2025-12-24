import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import {
  MonitorStatusPageEditForm,
  MonitorStatusPageEditFormValues,
} from '@/components/monitor/StatusPage/EditForm';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/page/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageAddComponent,
});

function PageAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const createPageMutation = trpc.page.createPage.useMutation({
    onError: defaultErrorHandler,
  });
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const handleSubmit = useEvent(
    async (values: MonitorStatusPageEditFormValues) => {
      const res = await createPageMutation.mutateAsync({
        ...values,
        workspaceId,
        type: 'status',
      });

      utils.page.getAllPages.refetch();

      navigate({
        to: '/page/$slug',
        params: {
          slug: res.slug,
        },
      });
    }
  );

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add Page')}</h1>}
    >
      <ScrollArea className="h-full">
        <div className="p-4">
          <Card>
            <CardContent className="pt-4">
              <MonitorStatusPageEditForm
                saveButtonLabel="Next"
                isLoading={createPageMutation.isPending}
                onFinish={handleSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
