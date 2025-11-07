import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useCurrentWorkspaceId } from '@/store/user';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';
import { toast } from 'sonner';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import {
  WorkerEditForm,
  WorkerEditFormValues,
} from '@/components/worker/WorkerEditForm';
import { useEvent } from '@/hooks/useEvent';

export const Route = createFileRoute('/worker/$workerId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { workerId } = Route.useParams<{ workerId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();

  const { data: worker, isLoading } = trpc.worker.get.useQuery({
    workspaceId,
    workerId,
  });

  const updateMutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
    onSuccess: () => {
      toast.success(t('Worker updated successfully'));
      navigate({
        to: '/worker/$workerId',
        params: { workerId },
      });
    },
  });

  const handleSubmit = useEvent(async (values: WorkerEditFormValues) => {
    if (!worker) return;

    await updateMutation.mutateAsync({
      ...values,
      id: worker.id,
      workspaceId,
    });
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!worker) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Edit Worker')}
          desc={t('Modify worker configuration and code')}
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <WorkerEditForm
          workerId={workerId}
          defaultValues={{
            name: worker.name,
            description: worker.description || '',
            code: worker.code,
            active: worker.active,
            enableCron: worker.enableCron || false,
            cronExpression: worker.cronExpression || '',
            visibility: worker.visibility || 'Public',
          }}
          onSubmit={handleSubmit}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}
