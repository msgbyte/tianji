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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeEditor } from '@/components/CodeEditor';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';
import { LuPlay, LuPencil, LuTrash, LuActivity } from 'react-icons/lu';
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
  const trpcUtils = trpc.useUtils();

  const {
    data: worker,
    isLoading,
    refetch,
  } = trpc.worker.get.useQuery({
    workspaceId,
    workerId,
  });

  const { data: executions, refetch: refetchExecutions } =
    trpc.worker.getExecutions.useQuery({
      workspaceId,
      workerId,
      limit: 10,
    });

  const selectedExecution =
    selectedExecutionIndex >= 0
      ? executions?.executions?.[selectedExecutionIndex]
      : null;

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
      <ScrollArea className="h-full overflow-hidden p-4">
        <Tabs defaultValue="code" className="space-y-4">
          <TabsList>
            <TabsTrigger value="code">{t('Code')}</TabsTrigger>
            <TabsTrigger value="executions">{t('Executions')}</TabsTrigger>
            <TabsTrigger value="stats">{t('Statistics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Worker Code')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeEditor
                  readOnly={true}
                  height={400}
                  value={worker.code}
                  onChange={() => {}} // Read-only
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Recent Executions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkerExecutionsTable
                  executions={executions?.executions || []}
                  onExecutionSelect={handleExecutionSelect}
                />
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
                        ? `${Math.round(stats.avgCpuTime / 1000000)}ms`
                        : '-'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

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
