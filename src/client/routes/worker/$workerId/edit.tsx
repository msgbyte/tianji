import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import {
  useCurrentWorkspaceId,
  useHasAdminPermission,
} from '@/store/user';
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
  const hasAdminPermission = useHasAdminPermission();
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();
  const workerQueryInput = { workspaceId, workerId };

  const { data: worker, isLoading } =
    trpc.worker.get.useQuery(workerQueryInput);
  const {
    data: environmentVariables,
    isLoading: isEnvironmentLoading,
  } = trpc.worker.getEnvironmentVariables.useQuery(workerQueryInput);
  const updateMutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
    onSuccess: async () => {
      await Promise.all([
        trpcUtils.worker.get.refetch(workerQueryInput),
        trpcUtils.worker.getEnvironmentVariables.refetch(workerQueryInput),
        trpcUtils.worker.getModuleBindings.refetch(workerQueryInput),
        trpcUtils.worker.all.invalidate({ workspaceId }),
        trpcUtils.sharedModule.all.invalidate({ workspaceId }),
        trpcUtils.sharedModule.consumers.invalidate(),
      ]);
      toast.success(t('Worker updated successfully'));
      navigate({
        to: '/worker/$workerId',
        params: { workerId },
      });
    },
  });

  const handleSubmit = useEvent(async (values: WorkerEditFormValues) => {
    if (!worker) return;

    const { ownerId, ...workerValues } = values;

    await updateMutation.mutateAsync({
      ...workerValues,
      ...(hasAdminPermission ? { ownerId } : {}),
      id: worker.id,
      workspaceId,
    });
  });

  if (isLoading || isEnvironmentLoading) {
    return <Loading />;
  }

  if (!worker || !environmentVariables) {
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
          key={workerId}
          workerId={workerId}
          defaultValues={{
            name: worker.name,
            description: worker.description || '',
            code: worker.code,
            active: worker.active,
            enableCron: worker.enableCron || false,
            cronExpression: worker.cronExpression || '',
            visibility: worker.visibility || 'Public',
            ownerId: worker.ownerId ?? undefined,
            environmentVariables,
          }}
          onSubmit={handleSubmit}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}
