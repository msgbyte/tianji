import { defaultErrorHandler, trpc } from '@/api/trpc';
import {
  AIRouterEditForm,
  AIRouterEditFormValues,
} from '@/components/aiRouter/AIRouterEditForm';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/aiRouter/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIRouterAddComponent,
});

function AIRouterAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const addRouterMutation = trpc.aiRouter.create.useMutation({
    onError: defaultErrorHandler,
  });
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();

  const handleSubmit = useEvent(async (values: AIRouterEditFormValues) => {
    const res = await addRouterMutation.mutateAsync({
      workspaceId,
      name: values.name,
      enabled: values.enabled,
    });

    await trpcUtils.aiRouter.all.invalidate({
      workspaceId,
    });

    navigate({
      to: '/aiRouter/$routerId',
      params: {
        routerId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add AI Router')}</h1>}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <AIRouterEditForm onSubmit={handleSubmit} />
      </ScrollArea>
    </CommonWrapper>
  );
}
