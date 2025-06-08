import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import {
  AIGatewayEditForm,
  AIGatewayEditFormValues,
} from '@/components/aiGateway/AIGatewayEditForm';

export const Route = createFileRoute('/aiGateway/$gatewayId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIGatewayEditComponent,
});

function AIGatewayEditComponent() {
  const { t } = useTranslation();
  const { gatewayId } = Route.useParams<{ gatewayId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();

  const { data: gatewayInfo, isLoading } = trpc.aiGateway.info.useQuery({
    workspaceId,
    gatewayId,
  });

  const updateGatewayMutation = trpc.aiGateway.update.useMutation({
    onError: defaultErrorHandler,
  });

  const handleSubmit = useEvent(async (values: AIGatewayEditFormValues) => {
    const res = await updateGatewayMutation.mutateAsync({
      workspaceId,
      gatewayId,
      name: values.name,
      modelApiKey: values.modelApiKey ?? null,
      customModelBaseUrl: values.customModelBaseUrl ?? null,
      customModelName: values.customModelName ?? null,
      customModelInputPrice: values.customModelInputPrice ?? null,
      customModelOutputPrice: values.customModelOutputPrice ?? null,
    });

    trpcUtils.aiGateway.all.refetch();

    navigate({
      to: '/aiGateway/$gatewayId',
      params: {
        gatewayId: res.id || gatewayId,
      },
    });
  });

  if (!gatewayId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Edit AI Gateway')}</h1>}
    >
      <div className="p-4">
        <AIGatewayEditForm
          defaultValues={gatewayInfo ?? undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </CommonWrapper>
  );
}
