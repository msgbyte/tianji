import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginationControls } from '@/components/PaginationControls';
import { CodeEditor } from '@/components/CodeEditor';
import { trpc } from '@/api/trpc';
import { cn } from '@/utils/style';
import { defaultErrorHandler } from '@/api/trpc';
import {
  LuPlay,
  LuPencil,
  LuTrash,
  LuActivity,
  LuRefreshCw,
  LuMinimize2,
  LuMaximize2,
  LuCodeXml,
} from 'react-icons/lu';
import { useLocalStorageState } from 'ahooks';
import { AlertConfirm } from '@/components/AlertConfirm';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { MarkdownViewer } from '@/components/MarkdownEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WorkerExecutionsTable } from '@/components/worker/WorkerExecutionsTable';
import { WorkerExecutionDetail } from '@/components/worker/WorkerExecutionDetail';
import { WorkerApiPreview } from '@/components/worker/WorkerApiPreview';
import { WorkerRevisionsSection } from '@/components/worker/WorkerRevisionsSection';

export const Route = createFileRoute('/worker/$workerId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { workerId } = Route.useParams<{ workerId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionResult, setShowExecutionResult] = useState(false);
  const [selectedExecutionIndex, setSelectedExecutionIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isPreviewCollapsed = false, setPreviewCollapsed] =
    useLocalStorageState<boolean>(`worker-preview-collapsed-${workerId}`, {
      defaultValue: false,
    });
  const trpcUtils = trpc.useUtils();

  const {
    data: worker,
    isLoading,
    refetch,
  } = trpc.worker.get.useQuery({
    workspaceId,
    workerId,
  });

  const {
    data: executionsData,
    refetch: refetchExecutions,
    isLoading: isLoadingExecutions,
  } = trpc.worker.getExecutions.useQuery({
    workspaceId,
    workerId,
    page: currentPage,
    pageSize,
  });

  const executions = executionsData?.executions || [];
  const pagination = executionsData?.pagination;

  const selectedExecution =
    selectedExecutionIndex >= 0 ? executions[selectedExecutionIndex] : null;

  const { data: stats } = trpc.worker.getExecutionStats.useQuery(
    {
      workspaceId,
      workerId,
      days: 7,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    }
  );

  const deleteMutation = trpc.worker.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const toggleActiveMutation = trpc.worker.toggleActive.useMutation({
    onError: defaultErrorHandler,
    onSuccess: () => {
      refetch();
    },
  });

  const executeMutation = trpc.worker.execute.useMutation({
    onError: defaultErrorHandler,
    onSuccess: (result) => {
      setExecutionResult(result);
      setShowExecutionResult(true);
      refetch();
    },
  });

  const handleDelete = useEvent(async () => {
    if (!worker) {
      return;
    }

    await deleteMutation.mutateAsync({
      workspaceId,
      workerId: worker.id,
    });
    trpcUtils.worker.all.invalidate();

    navigate({
      to: '/worker',
    });
  });

  const handleToggleActive = useEvent(async () => {
    if (!worker) return;

    await toggleActiveMutation.mutateAsync({
      workspaceId,
      workerId: worker.id,
      active: !worker.active,
    });
  });

  const handleExecute = useEvent(async () => {
    if (!worker) return;

    await executeMutation.mutateAsync({
      workspaceId,
      workerId: worker.id,
    });
    refetchExecutions();
  });

  const handleEdit = useEvent(() => {
    navigate({
      to: '/worker/$workerId/edit',
      params: { workerId },
    });
  });

  const handleExecutionSelect = useEvent((execution: any, index: number) => {
    setSelectedExecutionIndex(index);
  });

  const handleTogglePreviewCollapse = useEvent(() => {
    setPreviewCollapsed((prev) => !prev);
  });

  const handleNavigateToEditor = useEvent(() => {
    navigate({
      to: '/worker/$workerId/editor',
      params: { workerId },
    });
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!worker) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={
            <div className="flex items-center space-x-2">
              <span>{worker.name}</span>
              <Badge variant={worker.active ? 'default' : 'secondary'}>
                {worker.active ? t('Active') : t('Inactive')}
              </Badge>
              {worker.enableCron && (
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <LuActivity className="h-3 w-3" />
                  <span>{t('Cron Enabled')}</span>
                </Badge>
              )}
            </div>
          }
          actions={
            <div className="flex items-center space-x-2">
              {hasAdminPermission && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                    loading={toggleActiveMutation.isPending}
                  >
                    {worker.active ? t('Deactivate') : t('Activate')}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    Icon={LuPlay}
                    onClick={handleExecute}
                    loading={executeMutation.isPending}
                    disabled={!worker.active}
                  >
                    {t('Execute')}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    Icon={LuPencil}
                    onClick={handleEdit}
                  />

                  <AlertConfirm
                    title={t('Delete Worker')}
                    description={t(
                      'Are you sure you want to delete this worker? This action cannot be undone.'
                    )}
                    onConfirm={handleDelete}
                  >
                    <Button variant="outline" size="icon" Icon={LuTrash} />
                  </AlertConfirm>
                </>
              )}
            </div>
          }
        />
      }
    >
      <div className="h-full overflow-hidden p-4">
        <Tabs defaultValue="code" className="flex h-full flex-col space-y-4">
          <TabsList className="self-start">
            <TabsTrigger value="code">{t('Code')}</TabsTrigger>
            <TabsTrigger value="executions">{t('Executions')}</TabsTrigger>
            <TabsTrigger value="revisions">{t('Revisions')}</TabsTrigger>
            <TabsTrigger value="stats">{t('Statistics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex flex-1 flex-col space-y-4">
            {worker.description && (
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle>{t('Description')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownViewer
                    className="overflow-auto"
                    value={worker.description}
                  />
                </CardContent>
              </Card>
            )}

            <div
              className={cn('grid flex-1 grid-cols-1 gap-4', {
                'lg:grid-cols-2': !isPreviewCollapsed,
              })}
            >
              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>{t('Worker Code')}</CardTitle>
                  <div className="flex items-center gap-2">
                    <SimpleTooltip content={t('Open in Editor')}>
                      <Button
                        variant="outline"
                        size="icon"
                        Icon={LuCodeXml}
                        onClick={handleNavigateToEditor}
                        className="h-8 w-8"
                      />
                    </SimpleTooltip>
                    <SimpleTooltip
                      content={
                        isPreviewCollapsed
                          ? t('Expand Preview')
                          : t('Collapse Preview')
                      }
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        Icon={isPreviewCollapsed ? LuMinimize2 : LuMaximize2}
                        onClick={handleTogglePreviewCollapse}
                        className="h-8 w-8"
                      />
                    </SimpleTooltip>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CodeEditor
                    readOnly={true}
                    height={'100%'}
                    value={worker.code}
                    onChange={() => {}}
                  />
                </CardContent>
              </Card>

              {!isPreviewCollapsed && (
                <WorkerApiPreview
                  workspaceId={workspaceId}
                  workerId={workerId}
                  isActive={worker.active}
                  variant="card"
                  className="flex flex-col"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{t('Recent Executions')}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  Icon={LuRefreshCw}
                  onClick={() => {
                    setCurrentPage(1);
                    refetchExecutions();
                  }}
                  className="h-8"
                >
                  {t('Refresh')}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-y-auto">
                  <WorkerExecutionsTable
                    executions={executions}
                    loading={isLoadingExecutions}
                    onExecutionSelect={handleExecutionSelect}
                  />
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <PaginationControls
                    page={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                    disabled={isLoadingExecutions}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revisions" className="space-y-4">
            <WorkerRevisionsSection
              workspaceId={workspaceId}
              workerId={workerId}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {/* Cron Information */}
            {worker.enableCron && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LuActivity className="h-5 w-5" />
                    <span>{t('Cron Schedule')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground text-sm font-medium">
                        {t('Expression')}
                      </div>
                      <div className="font-mono text-sm">
                        {worker.cronExpression}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm font-medium">
                        {t('Status')}
                      </div>
                      <div className="text-sm">
                        {worker.active
                          ? t('Running')
                          : t('Stopped (Worker Inactive)')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {stats && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('Total Executions')}
                    </CardTitle>
                    <LuActivity className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalExecutions}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('Success Rate')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalExecutions > 0
                        ? `${Math.round((stats.successExecutions / stats.totalExecutions) * 100)}%`
                        : '0%'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('Avg Duration')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.avgDuration
                        ? `${Math.round(stats.avgDuration)}ms`
                        : '-'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('Avg Memory Usage')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.avgMemoryUsed
                        ? `${Math.round(stats.avgMemoryUsed / 1024)}KB`
                        : '-'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('Avg CPU Time')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.avgCpuTime
                        ? `${Math.round(stats.avgCpuTime / 1000)}μs`
                        : '-'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Execution Result Dialog */}
      <Dialog open={showExecutionResult} onOpenChange={setShowExecutionResult}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{t('Execution Result')}</span>
            </DialogTitle>
          </DialogHeader>

          {executionResult && (
            <WorkerExecutionDetail execution={executionResult} />
          )}
        </DialogContent>
      </Dialog>

      <Sheet
        open={Boolean(selectedExecution)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExecutionIndex(-1);
          }
        }}
      >
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {t('Execution Detail')}
              {selectedExecutionIndex >= 0 && ` #${selectedExecutionIndex + 1}`}
            </SheetTitle>
          </SheetHeader>

          {selectedExecution && (
            <WorkerExecutionDetail
              vertical={true}
              execution={selectedExecution}
            />
          )}
        </SheetContent>
      </Sheet>
    </CommonWrapper>
  );
}
