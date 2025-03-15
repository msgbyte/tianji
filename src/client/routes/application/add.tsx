import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import {
  ApplicationEditForm,
  ApplicationEditFormValues,
} from '@/components/application/ApplicationEditForm';

export const Route = createFileRoute('/application/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: ApplicationAddComponent,
});

function ApplicationAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const createApplicationMutation = trpc.application.create.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const onSubmit = useEvent(async (values: ApplicationEditFormValues) => {
    const res = await createApplicationMutation.mutateAsync({
      ...values,
      workspaceId,
    });

    utils.application.all.refetch();

    navigate({
      to: '/application/$applicationId',
      params: {
        applicationId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add Application')}</h1>}
    >
      <div className="p-4">
        <ApplicationEditForm onSubmit={onSubmit} />
      </div>
    </CommonWrapper>
  );
}
