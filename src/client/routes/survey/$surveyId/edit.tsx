import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SurveyEditForm,
  SurveyEditFormValues,
} from '@/components/survey/SurveyEditForm';

export const Route = createFileRoute('/survey/$surveyId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const { surveyId } = Route.useParams<{ surveyId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = trpc.survey.update.useMutation();
  const { data: survey, isLoading } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });

  const handleSubmit = useEvent(async (values: SurveyEditFormValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      surveyId,
      workspaceId,
    });

    navigate({
      to: '/survey/$surveyId',
      params: {
        surveyId: res.id,
      },
      replace: true,
    });
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!survey) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={<CommonHeader title={survey.name} desc={t('Edit')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <SurveyEditForm defaultValues={survey} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
