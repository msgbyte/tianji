import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import { LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/survey/$surveyId')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { surveyId } = Route.useParams<{ surveyId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: info } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });
  const { data: count } = trpc.survey.count.useQuery({
    workspaceId,
    surveyId,
  });
  const deleteMutation = trpc.survey.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, surveyId });
    trpcUtils.survey.all.refetch();
    navigate({
      to: '/survey',
      replace: true,
    });
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <div>
              <AlertConfirm
                title={t('Confirm to delete this survey?')}
                description={t('Survey name: {{name}} | data count: {{num}}', {
                  name: info?.name ?? '',
                  num: count ?? 0,
                })}
                content={t('It will permanently delete the relevant data')}
                onConfirm={handleDelete}
              >
                <Button variant="outline" size="icon" Icon={LuTrash} />
              </AlertConfirm>
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <ScrollBar orientation="horizontal" />

        {/*  */}
      </ScrollArea>
    </CommonWrapper>
  );
}
