import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createColumnHelper } from '@/components/DataTable';
import { useMemo } from 'react';
import { SurveyDownloadBtn } from '@/components/survey/SurveyDownloadBtn';
import dayjs from 'dayjs';
import { SurveyUsageBtn } from '@/components/survey/SurveyUsageBtn';
import { VirtualizedInfiniteDataTable } from '@/components/VirtualizedInfiniteDataTable';
import { Loading } from '@/components/Loading';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import { useRegisterCommand } from '@/components/CommandPanel/store';
import { useAIAction } from '@/components/ai/useAIAction';
import { useAIStoreContext } from '@/components/ai/useAIStoreContext';

type SurveyResultItem =
  AppRouterOutput['survey']['resultList']['items'][number];

const columnHelper = createColumnHelper<SurveyResultItem>();

export const Route = createFileRoute('/survey/$surveyId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { surveyId } = Route.useParams<{ surveyId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const hasAdminPermission = useHasAdminPermission();
  useAIStoreContext({
    type: 'survey',
    surveyId,
  });
  const { data: info } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });
  const { data: count } = trpc.survey.count.useQuery({
    workspaceId,
    surveyId,
  });
  const {
    data: resultList,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isLoading,
    isInitialLoading,
  } = trpc.survey.resultList.useInfiniteQuery(
    {
      workspaceId,
      surveyId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const { data: surveyStats = [] } = trpc.survey.stats.useQuery({
    workspaceId,
    surveyId,
    startAt: dayjs().subtract(1, 'week').startOf('days').valueOf(),
    endAt: dayjs().endOf('days').valueOf(),
  });
  const deleteMutation = trpc.survey.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();
  const { askAIQuestion } = useAIAction();

  useRegisterCommand('survey-ai', {
    label: (text) => t('Ask AI about this survey with: {{text}}', { text }),
    handler: async (input) => {
      askAIQuestion(input);
    },
  });

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, surveyId });
    trpcUtils.survey.all.refetch();
    navigate({
      to: '/survey',
      replace: true,
    });
  });

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: t('ID'),
        size: 230,
      }),
      ...(info?.payload.items.map((item) =>
        columnHelper.accessor(`payload.${item.name}`, {
          header: item.label,
        })
      ) ?? []),
      columnHelper.accessor('createdAt', {
        header: t('Created At'),
        size: 200,
        cell: (props) => dayjs(props.getValue()).format('YYYY-MM-DD HH:mm:ss'),
      }),
    ];
  }, [t, info]);

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <Button
                  variant="outline"
                  size="icon"
                  Icon={LuPencil}
                  onClick={() =>
                    navigate({
                      to: '/survey/$surveyId/edit',
                      params: {
                        surveyId,
                      },
                    })
                  }
                />
              )}

              {hasAdminPermission && (
                <AlertConfirm
                  title={t('Confirm to delete this survey?')}
                  description={t(
                    'Survey name: {{name}} | data count: {{num}}',
                    {
                      name: info?.name ?? '',
                      num: count ?? 0,
                    }
                  )}
                  content={t('It will permanently delete the relevant data')}
                  onConfirm={handleDelete}
                >
                  <Button variant="outline" size="icon" Icon={LuTrash} />
                </AlertConfirm>
              )}
            </div>
          }
        />
      }
    >
      <div className="flex h-full flex-col overflow-hidden p-4">
        <div className="mb-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t('Count')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>{count}</div>
                <div className="flex gap-2">
                  <SurveyUsageBtn surveyId={surveyId} />
                  <SurveyDownloadBtn surveyId={surveyId} />
                </div>
              </div>

              <div className="mt-4">
                <TimeEventChart
                  className="h-[240px] w-full"
                  data={surveyStats}
                  unit="day"
                  chartConfig={{
                    count: {
                      label: t('Count'),
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-2 text-lg font-bold">{t('Preview')}</div>

        <div className="flex-1 overflow-hidden">
          {isInitialLoading ? (
            <Loading />
          ) : (
            <VirtualizedInfiniteDataTable
              columns={columns}
              data={resultList}
              onFetchNextPage={fetchNextPage}
              isFetching={isFetching}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
            />
          )}
        </div>
      </div>
    </CommonWrapper>
  );
}
