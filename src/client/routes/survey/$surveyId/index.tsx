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
import { LuCopy, LuEllipsisVertical, LuPencil, LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createColumnHelper } from '@/components/DataTable';
import { PropsWithChildren, useMemo, useState } from 'react';
import { SurveyDownloadBtn } from '@/components/survey/SurveyDownloadBtn';
import dayjs from 'dayjs';
import { SurveyUsageBtn } from '@/components/survey/SurveyUsageBtn';
import { VirtualizedInfiniteDataTable } from '@/components/VirtualizedInfiniteDataTable';
import { Loading } from '@/components/Loading';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import { useRegisterCommand } from '@/components/CommandPanel/store';
import { useAIAction } from '@/components/ai/useAIAction';
import { useAIStoreContext } from '@/components/ai/useAIStoreContext';
import {
  Sheet,
  SheetContent,
  SheetDataSection,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty } from 'antd';
import React from 'react';
import { useGlobalConfig } from '@/hooks/useConfig';
import { DataRender } from '@/components/DataRender';
import { SurveyAIBtn } from '@/components/survey/SurveyAIBtn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SurveyCategoryChart } from '@/components/survey/SurveyCategoryChart';
import { useSurveyListColumns } from '@/components/survey/useSurveyListColumns';
import { useSocketSubscribe } from '@/api/socketio';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const config = useGlobalConfig();
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
    refetch,
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
    startAt: dayjs().subtract(14, 'days').startOf('days').valueOf(),
    endAt: dayjs().endOf('days').valueOf(),
  });
  const deleteMutation = trpc.survey.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const duplicateMutation = trpc.survey.duplicate.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();
  const { askAIQuestion } = useAIAction();

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  const { selectedIndex, setSelectedIndex, columns } =
    useSurveyListColumns(surveyId);

  //flatten the array of arrays from the useInfiniteQuery hook
  const flatData = useMemo(
    () => resultList?.pages?.flatMap((page) => page.items) ?? [],
    [resultList]
  );

  const selectedItem = flatData[selectedIndex];

  useRegisterCommand('survey-ai', {
    label: (text) => t('Ask AI about this survey with: {{text}}', { text }),
    enabled: config.ai.enable,
    handler: async (input) => {
      askAIQuestion(input);
    },
  });

  useSocketSubscribe('onSurveyClassifyWorkCompleted', (data) => {
    refetch();
    toast(
      t('AI Task has been completed. Result:') + '\n' + JSON.stringify(data),
      {
        duration: 8000,
      }
    );
  });

  useSocketSubscribe('onSurveyTranslationWorkCompleted', (data) => {
    refetch();
    toast(
      t('AI Task has been completed. Result:') + '\n' + JSON.stringify(data),
      {
        duration: 8000,
      }
    );
  });

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, surveyId });
    trpcUtils.survey.all.refetch();
    navigate({
      to: '/survey',
      replace: true,
    });
  });

  const handleDuplicate = useEvent(async () => {
    if (!duplicateName.trim()) {
      toast.error(t('Please enter a name for the duplicated survey'));
      return;
    }

    try {
      const newSurvey = await duplicateMutation.mutateAsync({
        workspaceId,
        surveyId,
        name: duplicateName.trim(),
      });

      trpcUtils.survey.all.refetch();
      setDuplicateModalOpen(false);
      setDuplicateName('');

      navigate({
        to: '/survey/$surveyId',
        params: {
          surveyId: newSurvey.id,
        },
      });
    } catch (error) {
      // Error handling is done by the mutation's onError
    }
  });

  const handleOpenDuplicateModal = useEvent(() => {
    setDuplicateName(info?.name ? `${info.name} - Copy` : 'New Survey');
    setDuplicateModalOpen(true);
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild={true}
                    className="cursor-pointer"
                  >
                    <Button variant="outline" size="icon" className="shrink-0">
                      <LuEllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate({
                          to: '/survey/$surveyId/edit',
                          params: {
                            surveyId,
                          },
                        })
                      }
                    >
                      <LuPencil className="mr-2" />
                      {t('Edit')}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleOpenDuplicateModal}>
                      <LuCopy className="mr-2" />
                      {t('Duplicate')}
                    </DropdownMenuItem>

                    <AlertConfirm
                      title={t('Confirm to delete this survey?')}
                      description={t(
                        'Survey name: {{name}} | data count: {{num}}',
                        {
                          name: info?.name ?? '',
                          num: count ?? 0,
                        }
                      )}
                      content={t(
                        'It will permanently delete the relevant data'
                      )}
                      onConfirm={handleDelete}
                    >
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 data-[highlighted]:!bg-red-50 data-[highlighted]:!text-red-700"
                      >
                        <LuTrash className="mr-2" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </AlertConfirm>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  {config.ai.enable && <SurveyAIBtn surveyId={surveyId} />}
                  <SurveyUsageBtn surveyId={surveyId} />
                  <SurveyDownloadBtn surveyId={surveyId} />
                </div>
              </div>

              <div className="mt-4">
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList>
                    <TabsTrigger value="recent">
                      {t('Recent Survey Count')}
                    </TabsTrigger>

                    {config.ai.enable && (
                      <TabsTrigger value="category">
                        {t('Survey Category')}
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="recent">
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
                  </TabsContent>

                  {config.ai.enable && (
                    <TabsContent value="category">
                      <SurveyCategoryChart surveyId={surveyId} />
                    </TabsContent>
                  )}
                </Tabs>
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
              key={surveyId}
              selectedIndex={selectedIndex}
              columns={columns}
              data={flatData}
              onFetchNextPage={fetchNextPage}
              isFetching={isFetching}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
            />
          )}
        </div>

        <Sheet
          open={Boolean(selectedItem)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIndex(-1);
            }
          }}
        >
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {t('Detail')} {selectedIndex >= 0 && `#${selectedIndex + 1}`}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 py-4">
              {selectedItem ? (
                <div>
                  <SheetDataSection label="ID">
                    {selectedItem.id}
                  </SheetDataSection>

                  <SheetDataSection label={t('Category')}>
                    {selectedItem.aiCategory ?? (
                      <span className="opacity-40">(null)</span>
                    )}
                  </SheetDataSection>

                  <SheetDataSection label={t('Created At')}>
                    {dayjs(selectedItem.createdAt).format(
                      'YYYY-MM-DD HH:mm:ss'
                    )}
                  </SheetDataSection>

                  {info?.payload.items.map((item) => {
                    return (
                      <SheetDataSection
                        key={item.name}
                        label={item.label ?? item.name}
                      >
                        <DataRender
                          type={item.type}
                          value={selectedItem.payload[item.name]}
                        />
                      </SheetDataSection>
                    );
                  })}
                </div>
              ) : (
                <Empty />
              )}
            </ScrollArea>

            <SheetFooter>
              <Button
                variant="outline"
                disabled={selectedIndex === 0}
                onClick={() => {
                  setSelectedIndex((prev) => prev - 1);
                }}
              >
                {t('Prev')}
              </Button>
              <Button
                disabled={selectedIndex === flatData.length - 1 && !hasNextPage}
                loading={isFetching || isLoading}
                onClick={() => {
                  if (selectedIndex < flatData.length - 1) {
                    setSelectedIndex((prev) => prev + 1);
                  } else {
                    // fetch next page
                    fetchNextPage().then(() => {
                      setSelectedIndex((prev) => prev + 1);
                    });
                  }
                }}
              >
                {t('Next')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Duplicate Dialog */}
        <Dialog
          open={duplicateModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDuplicateModalOpen(false);
              setDuplicateName('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Duplicate Survey')}</DialogTitle>
              <DialogDescription>
                {t('Create a copy of this survey with the same configuration.')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="survey-name" className="text-right">
                  {t('Survey Name')}
                </Label>
                <Input
                  id="survey-name"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder={t('Enter name for the duplicated survey')}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDuplicateModalOpen(false);
                  setDuplicateName('');
                }}
              >
                {t('Cancel')}
              </Button>
              <Button
                onClick={handleDuplicate}
                loading={duplicateMutation.isPending}
              >
                {t('Duplicate')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CommonWrapper>
  );
}
