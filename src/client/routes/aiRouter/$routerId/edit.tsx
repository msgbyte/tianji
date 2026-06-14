import { defaultErrorHandler, trpc } from '@/api/trpc';
import {
  AIRouterEditForm,
  AIRouterEditFormValues,
} from '@/components/aiRouter/AIRouterEditForm';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/aiRouter/$routerId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIRouterEditComponent,
});

function AIRouterEditComponent() {
  const { t } = useTranslation();
  const { routerId } = Route.useParams<{ routerId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();

  const { data: routerInfo, isLoading } = trpc.aiRouter.info.useQuery({
    workspaceId,
    routerId,
  });

  const updateRouterMutation = trpc.aiRouter.update.useMutation({
    onError: defaultErrorHandler,
  });

  const handleSubmit = useEvent(async (values: AIRouterEditFormValues) => {
    const res = await updateRouterMutation.mutateAsync({
      workspaceId,
      routerId,
      name: values.name,
      enabled: values.enabled,
    });

    await trpcUtils.aiRouter.all.invalidate({
      workspaceId,
    });
    await trpcUtils.aiRouter.info.invalidate({
      workspaceId,
      routerId,
    });

    navigate({
      to: '/aiRouter/$routerId',
      params: {
        routerId: res.id || routerId,
      },
    });
  });

  if (!routerId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!routerInfo) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Edit AI Router')}</h1>}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <AIRouterEditForm
          defaultValues={
            {
              name: routerInfo.name,
              enabled: routerInfo.enabled,
            }
          }
          onSubmit={handleSubmit}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}
