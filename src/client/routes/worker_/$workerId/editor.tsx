import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/PaginationControls';
import { CodeEditor } from '@/components/CodeEditor';
import { WorkerExecutionsTable } from '@/components/worker/WorkerExecutionsTable';
import { WorkerExecutionDetail } from '@/components/worker/WorkerExecutionDetail';
import { WorkerApiPreview } from '@/components/worker/WorkerApiPreview';
import { NavigationBlocker } from '@/components/NavigationBlocker';
import { AppRouterOutput, defaultErrorHandler, trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { routeAuthBeforeLoad } from '@/utils/route';
import { LuActivity, LuArrowLeft, LuRefreshCw, LuRocket } from 'react-icons/lu';
import { Allotment } from 'allotment';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import 'allotment/dist/style.css';

type FunctionWorkerExecution =
  AppRouterOutput['worker']['getExecutions']['executions'][number];

interface ExecutionPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const Route = createFileRoute('/worker/$workerId/editor')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { workerId } = Route.useParams<{ workerId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExecutionIndex, setSelectedExecutionIndex] =
    useState<number>(-1);
  const [code, setCode] = useState('');

  const pageSize = 10;

  const {
    data: worker,
    isLoading: isLoadingWorker,
    refetch: refetchWorker,
  } = trpc.worker.get.useQuery({
    workspaceId,
    workerId,
  });

  const {
    data: executionsData,
    isLoading: isLoadingExecutions,
    refetch: refetchExecutions,
  } = trpc.worker.getExecutions.useQuery({
    workspaceId,
    workerId,
    page: currentPage,
    pageSize,
  });

  const updateMutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
  });

  const executeMutation = trpc.worker.execute.useMutation({
    onError: defaultErrorHandler,
  });

  const testCodeMutation = trpc.worker.testCode.useMutation({
    onError: defaultErrorHandler,
  });

  useEffect(() => {
    if (!executionsData?.executions?.length) {
      setSelectedExecutionIndex(-1);
      return;
    }
  }, [executionsData?.executions]);

  const executions: FunctionWorkerExecution[] =
    executionsData?.executions ?? [];
  const pagination: ExecutionPagination | undefined =
    executionsData?.pagination;

  useEffect(() => {
    if (worker?.code !== undefined) {
      setCode(worker.code);
    }
  }, [worker?.code]);

  const selectedExecution = useMemo<FunctionWorkerExecution | null>(() => {
    if (selectedExecutionIndex < 0) {
      return null;
    }
    return executions[selectedExecutionIndex] ?? null;
  }, [executions, selectedExecutionIndex]);

  const isCodeDirty = useMemo(() => {
    if (!worker) {
      return false;
    }

    return code !== worker.code;
  }, [code, worker]);

  const handleSave = useEvent(async () => {
    if (!worker || !hasAdminPermission || !isCodeDirty) {
      return;
    }

    await updateMutation.mutateAsync({
      id: worker.id,
      workspaceId,
      name: worker.name,
      description: worker.description ?? undefined,
      code,
      active: worker.active,
      enableCron: worker.enableCron,
      cronExpression: worker.cronExpression ?? undefined,
    });
    toast.success(t('Worker updated successfully'));
    refetchWorker();
  });

  const handleLogRefresh = useEvent(() => {
    refetchExecutions();
  });

  const handleExecutionSelect = useEvent((execution: any, index: number) => {
    setSelectedExecutionIndex(index);
  });

  const handleChangePage = useEvent((page: number) => {
    setCurrentPage(page);
  });

  const handleNavigateBack = useEvent(() => {
    navigate({
      to: '/worker/$workerId',
      params: { workerId },
    });
  });

  const handleReplay = useEvent(async (payload: unknown) => {
    if (!worker) {
      return;
    }

    await executeMutation.mutateAsync({
      workspaceId,
      workerId: worker.id,
      payload: payload as Record<string, any> | undefined,
    });
    toast.success(t('Worker executed successfully'));
    refetchExecutions();
    setSelectedExecutionIndex(-1);
  });

  const handleTestExecution = useEvent(
    async (payload?: Record<string, any>) => {
      const result = await testCodeMutation.mutateAsync({
        workspaceId,
        code,
        payload,
      });
      return result;
    }
  );

  useEffect(() => {
    if (currentPage > 1 && pagination && currentPage > pagination.totalPages) {
      setCurrentPage(Math.max(1, pagination.totalPages));
    }
  }, [currentPage, pagination]);

  useEffect(() => {
    if (worker?.code !== undefined) {
      setCode((prev) => {
        if (prev === worker.code) {
          return prev;
        }
        return worker.code;
      });
    }
  }, [worker?.code]);

  useEffect(() => {
    setCurrentPage(1);
  }, [workerId]);

  if (isLoadingWorker) {
    return <Loading />;
  }

  if (!worker) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper>
      <NavigationBlocker when={isCodeDirty} />

      <div className="bg-background flex h-screen flex-col overflow-hidden">
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                Icon={LuArrowLeft}
                onClick={handleNavigateBack}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{worker.name}</span>
                <Badge variant={worker.active ? 'default' : 'secondary'}>
                  {worker.active ? t('Active') : t('Inactive')}
                </Badge>
                {worker.enableCron && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <LuActivity className="h-3 w-3" />
                    <span>{t('Cron Enabled')}</span>
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground text-xs">
                {t('Last updated at {{time}}', {
                  time: dayjs(worker.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                Icon={LuRefreshCw}
                onClick={handleLogRefresh}
                loading={isLoadingExecutions}
              >
                {t('Refresh')}
              </Button>
              {hasAdminPermission && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  loading={updateMutation.isPending}
                  Icon={LuRocket}
                  disabled={!isCodeDirty || updateMutation.isPending}
                >
                  {t('Deploy')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Allotment>
          <Allotment.Pane>
            <CodeEditor
              readOnly={!hasAdminPermission || updateMutation.isPending}
              height="100%"
              value={code}
              onChange={setCode}
              language="typescript"
            />
          </Allotment.Pane>
          <Allotment.Pane>
            <Allotment vertical={true}>
              <Allotment.Pane minSize={500} snap={true}>
                <div className="flex flex-col gap-2">
                  <div className="overflow-hidden">
                    <WorkerExecutionsTable
                      executions={executions}
                      loading={isLoadingExecutions}
                      onExecutionSelect={handleExecutionSelect}
                    />
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="px-4 pb-4">
                      <PaginationControls
                        page={currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handleChangePage}
                        disabled={isLoadingExecutions}
                      />
                    </div>
                  )}
                </div>
              </Allotment.Pane>

              <Allotment.Pane>
                <WorkerApiPreview
                  workspaceId={workspaceId}
                  workerId={workerId}
                  isActive={worker.active}
                  disabled={isCodeDirty}
                  onPreviewLoaded={handleLogRefresh}
                  onTest={hasAdminPermission ? handleTestExecution : undefined}
                  variant="split"
                />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
        </Allotment>
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
                {selectedExecutionIndex >= 0 &&
                  ` #${selectedExecutionIndex + 1}`}
              </SheetTitle>
            </SheetHeader>

            {selectedExecution ? (
              <WorkerExecutionDetail
                vertical={true}
                execution={selectedExecution}
                onReplay={handleReplay}
              />
            ) : (
              <div className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
                {t('Select an execution to inspect details')}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </CommonWrapper>
  );
}

export default PageComponent;
