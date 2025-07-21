import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'react-icons/lu';
import { useState } from 'react';
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
import { toast } from 'sonner';

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
    if (!worker) return;

    await deleteMutation.mutateAsync({
      workspaceId,
      workerId: worker.id,
    });

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
    setIsLoadingPreview(true);
    setPreviewKey((prev) => prev + 1);
  });

  const handlePreviewLoad = useEvent(() => {
    setIsLoadingPreview(false);
  });

  const handleOpenInNewWindow = useEvent(() => {
    const url = `${window.location.origin}/api/worker/${workspaceId}/${workerId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  const handleCopyUrl = useEvent(async () => {
    const url = `${window.location.origin}/api/worker/${workspaceId}/${workerId}`;
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
            <TabsTrigger value="stats">{t('Statistics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex flex-1 flex-col space-y-4">
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>{t('Worker Code')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CodeEditor
                    readOnly={true}
                    height={'100%'}
                    value={worker.code}
                    onChange={() => {}} // Read-only
                  />
                </CardContent>
              </Card>

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
                <CardContent className="flex-1">
                  {previewKey > 0 ? (
                    <div className="flex h-full flex-col space-y-2">
                      <p className="text-muted-foreground text-sm">
                        {t('Live preview of the worker API endpoint:')}
                      </p>
                      <div className="bg-background relative h-full flex-1 rounded-md border">
                        {isLoadingPreview && (
                          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                              <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2" />
                              <span className="text-sm">{t('Loading...')}</span>
                            </div>
                          </div>
                        )}
                        <iframe
                          key={previewKey}
                          src={`${window.location.origin}/api/worker/${workspaceId}/${workerId}`}
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
                          {t('Click "Execute Preview" to see the live result')}
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

          <TabsContent value="stats" className="space-y-4">
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
            <WorkerExecutionDetail execution={selectedExecution} />
          )}
        </SheetContent>
      </Sheet>
    </CommonWrapper>
  );
}
