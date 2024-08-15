import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import {
  SurveyEditForm,
  SurveyEditFormValues,
} from '@/components/survey/SurveyEditForm';

export const Route = createFileRoute('/survey/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const createMutation = trpc.survey.create.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const onSubmit = useEvent(async (values: SurveyEditFormValues) => {
    const res = await createMutation.mutateAsync({
      ...values,
      workspaceId,
    });

    utils.survey.all.refetch();

    navigate({
      to: '/survey/$surveyId',
      params: {
        surveyId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add Survey')}</h1>}
    >
      <div className="p-4">
        <SurveyEditForm onSubmit={onSubmit} />
      </div>
    </CommonWrapper>
  );
}
