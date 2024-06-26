import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, createColumnHelper } from '@/components/DataTable';
import { useMemo } from 'react';
import { SurveyDownloadBtn } from '@/components/survey/SurveyDownloadBtn';
import dayjs from 'dayjs';
import { SurveyUsageBtn } from '@/components/survey/SurveyUsageBtn';
import { Scrollbar } from '@radix-ui/react-scroll-area';

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
  const { data: info } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });
  const { data: count } = trpc.survey.count.useQuery({
    workspaceId,
    surveyId,
  });
  const { data: resultList } = trpc.survey.resultList.useInfiniteQuery({
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

  const dataSource = resultList?.pages.map((p) => p.items).flat() ?? [];

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: t('ID'),
        size: 150,
      }),
      ...(info?.payload.items.map((item) =>
        columnHelper.accessor(`payload.${item.name}`, {
          header: item.label,
        })
      ) ?? []),
      columnHelper.accessor('createdAt', {
        header: t('Created At'),
        size: 130,
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
      <div className="h-full overflow-hidden p-4">
        <div className="mb-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t('Count')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between">
              <div>{count}</div>
              <div className="flex gap-2">
                <SurveyUsageBtn surveyId={surveyId} />
                <SurveyDownloadBtn surveyId={surveyId} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-2 text-lg font-bold">{t('Preview')}</div>

        <ScrollArea className="w-full">
          <Scrollbar orientation="horizontal" />

          <DataTable columns={columns} data={dataSource} />
        </ScrollArea>
      </div>
    </CommonWrapper>
  );
}
