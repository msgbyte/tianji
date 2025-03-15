import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ApplicationEditForm,
  ApplicationEditFormValues,
} from '@/components/application/ApplicationEditForm';
import { useMemo } from 'react';

export const Route = createFileRoute('/application/$applicationId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const { applicationId } = Route.useParams<{ applicationId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = trpc.application.update.useMutation({
    onError: defaultErrorHandler,
  });
  const { data: application, isLoading } = trpc.application.info.useQuery({
    workspaceId,
    applicationId,
  });
  const utils = trpc.useUtils();

  const defaultValues = useMemo(() => {
    if (!application) {
      return undefined;
    }

    return {
      name: application.name,
      appstoreId: application.applicationStoreInfos.find(
        (info) => info.storeType === 'appstore'
      )?.storeId,
      playstoreId: application.applicationStoreInfos.find(
        (info) => info.storeType === 'googleplay'
      )?.storeId,
    } satisfies ApplicationEditFormValues;
  }, [application]);

  const handleSubmit = useEvent(async (values: ApplicationEditFormValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      applicationId,
      workspaceId,
    });

    utils.application.all.refetch({ workspaceId });

    navigate({
      to: '/application/$applicationId',
      params: {
        applicationId: res.id,
      },
      replace: true,
    });
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!application) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={<CommonHeader title={application.name} desc={t('Edit')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <ApplicationEditForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}
