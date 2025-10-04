import React, { useMemo, useState } from 'react';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { CodeEditor } from '@/components/CodeEditor';
import { trpc } from '@/api/trpc';
import { cn } from '@/utils/style';
import { defaultErrorHandler } from '@/api/trpc';
import {
  LuPlay,
  LuPencil,
  LuTrash,
  LuActivity,
  LuGlobe,
  LuRefreshCw,
  LuExternalLink,
  LuCopy,
  LuMinimize2,
  LuMaximize2,
} from 'react-icons/lu';
import { useLocalStorageState } from 'ahooks';
import { AlertConfirm } from '@/components/AlertConfirm';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
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
import {
  UrlParamsInput,
  getQueryString,
  type UrlParam,
} from '@/components/worker/UrlParamsInput';
import { toast } from 'sonner';
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
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewParams, setPreviewParams] = useState<UrlParam[]>([
    { key: '', value: '' },
  ]);
  const [activePreviewParams, setActivePreviewParams] = useState<UrlParam[]>([
    { key: '', value: '' },
  ]);
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

  const { data: stats } = trpc.worker.getExecutionStats.useQuery({
    workspaceId,
    workerId,
    days: 7,
  });

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

  const handleExecutePreview = useEvent(() => {
    setActivePreviewParams([...previewParams]);
    setIsLoadingPreview(true);
    setPreviewKey((prev) => prev + 1);
  });

  const handleTogglePreviewCollapse = useEvent(() => {
    setPreviewCollapsed((prev) => !prev);
  });

  const handlePreviewLoad = useEvent(() => {
    setIsLoadingPreview(false);
  });

  const handleOpenInNewWindow = useEvent(() => {
    const baseUrl = `${window.location.origin}/api/worker/${workspaceId}/${workerId}`;
    const queryString = getQueryString(previewParams);
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  const handleCopyUrl = useEvent(async () => {
    const baseUrl = `${window.location.origin}/api/worker/${workspaceId}/${workerId}`;
    const queryString = getQueryString(previewParams);
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('API endpoint URL copied to clipboard'));
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(t('API endpoint URL copied to clipboard'));
    }
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
          desc={worker.description || undefined}
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
            <div
              className={cn('grid flex-1 grid-cols-1 gap-4', {
                'lg:grid-cols-2': !isPreviewCollapsed,
              })}
            >
              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>{t('Worker Code')}</CardTitle>
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
                <Card className="flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>{t('Preview')}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <SimpleTooltip content={t('Copy API URL')}>
                        <Button
                          variant="outline"
                          size="icon"
                          Icon={LuCopy}
                          onClick={handleCopyUrl}
                          className="h-8 w-8"
                        />
                      </SimpleTooltip>
                      <SimpleTooltip content={t('Open in New Window')}>
                        <Button
                          variant="outline"
                          size="icon"
                          Icon={LuExternalLink}
                          onClick={handleOpenInNewWindow}
                          disabled={!worker.active}
                          className="h-8 w-8"
                        />
                      </SimpleTooltip>
                      <SimpleTooltip content={t('Execute Preview')}>
                        <Button
                          variant="outline"
                          size="icon"
                          Icon={LuPlay}
                          onClick={handleExecutePreview}
                          loading={isLoadingPreview}
                          disabled={!worker.active}
                          className="h-8 w-8"
                        />
                      </SimpleTooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <UrlParamsInput
                      params={previewParams}
                      onChange={setPreviewParams}
                    />

                    {previewKey > 0 ? (
                      <div className="flex h-full flex-1 flex-col space-y-4">
                        <p className="text-muted-foreground text-sm">
                          {t('Live preview of the worker API endpoint:')}
                        </p>
                        <div className="relative h-full flex-1 rounded-md border bg-white">
                          {isLoadingPreview && (
                            <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-sm">
                              <div className="flex items-center space-x-2">
                                <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2" />
                                <span className="text-sm">
                                  {t('Loading...')}
                                </span>
                              </div>
                            </div>
                          )}
                          <iframe
                            key={previewKey}
                            src={`${window.location.origin}/api/worker/${workspaceId}/${workerId}${getQueryString(activePreviewParams) ? `?${getQueryString(activePreviewParams)}` : ''}`}
                            className="h-full w-full rounded-md"
                            title="Worker Preview"
                            sandbox="allow-same-origin allow-scripts"
                            onLoad={handlePreviewLoad}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                        <div className="space-y-2 text-center">
                          <LuPlay className="mx-auto h-12 w-12" />
                          <p>
                            {t(
                              'Click "Execute Preview" to see the live result'
                            )}
                          </p>
                          {!worker.active && (
                            <p className="text-sm text-orange-500">
                              {t('Worker must be active to preview')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <PaginationItem>
                                <span className="px-3 py-2">...</span>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < pagination.totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
