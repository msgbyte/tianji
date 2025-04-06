import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import {
  AIGatewayEditForm,
  AIGatewayEditFormValues,
} from '@/components/aiGateway/AIGatewayEditForm';

export const Route = createFileRoute('/aiGateway/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: AIGatewayAddComponent,
});

function AIGatewayAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const addGatewayMutation = trpc.aiGateway.create.useMutation({
    onError: defaultErrorHandler,
  });
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();

  const handleSubmit = useEvent(async (values: AIGatewayEditFormValues) => {
    const res = await addGatewayMutation.mutateAsync({
      workspaceId,
      name: values.name,
    });

    trpcUtils.aiGateway.all.refetch(); // TODO: Uncomment when API is available

    navigate({
      to: '/aiGateway/$gatewayId',
      params: {
        gatewayId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add AI Gateway')}</h1>}
    >
      <div className="p-4">
        <AIGatewayEditForm onSubmit={handleSubmit} />
      </div>
    </CommonWrapper>
  );
}
