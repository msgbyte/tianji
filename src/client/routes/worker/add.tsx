import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';
import {
  WorkerEditForm,
  WorkerEditFormValues,
} from '@/components/worker/WorkerEditForm';
import { toast } from 'sonner';

export const Route = createFileRoute('/worker/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: WorkerAddComponent,
});

function WorkerAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();

  const mutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
    onSuccess: (worker) => {
      toast.success(t('Worker created successfully'));
      navigate({
        to: '/worker/$workerId',
        params: { workerId: worker.id },
      });
    },
  });

  const trpcUtils = trpc.useUtils();

  const handleSubmit = useEvent(async (values: WorkerEditFormValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      workspaceId,
    });

    await Promise.all([
      trpcUtils.worker.all.invalidate({ workspaceId }),
      trpcUtils.sharedModule.all.invalidate({ workspaceId }),
      trpcUtils.sharedModule.consumers.invalidate(),
    ]);
    navigate({
      to: '/worker/$workerId',
      params: { workerId: res.id },
    });
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Add Function Worker')}
          desc={t('Create a new JavaScript function worker')}
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <WorkerEditForm onSubmit={handleSubmit} />
      </ScrollArea>
    </CommonWrapper>
  );
}
