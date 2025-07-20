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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';
import {
  LuPlay,
  LuPencil,
  LuTrash,
  LuSave,
  LuX,
  LuActivity,
  LuCheck,
} from 'react-icons/lu';
import { useState, useEffect } from 'react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertConfirm } from '@/components/AlertConfirm';
import { toast } from 'sonner';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dayjs from 'dayjs';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute('/worker/$workerId')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { workerId } = Route.useParams<{ workerId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const [isEditing, setIsEditing] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionResult, setShowExecutionResult] = useState(false);

  const {
    data: worker,
    isLoading,
    refetch,
  } = trpc.worker.get.useQuery({
    workspaceId,
    workerId,
  });

  const { data: executions } = trpc.worker.getExecutions.useQuery({
    workspaceId,
    workerId,
    limit: 10,
  });

  const { data: stats } = trpc.worker.getExecutionStats.useQuery({
    workspaceId,
    workerId,
    days: 7,
  });

  const updateMutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
    onSuccess: () => {
      toast.success(t('Worker updated successfully'));
      setIsEditing(false);
      refetch();
    },
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
    },
  });

  useEffect(() => {
    if (worker) {
      form.reset({
        name: worker.name,
        description: worker.description || '',
        code: worker.code,
      });
    }
  }, [worker, form]);

  const handleSubmit = useEvent(async (values: FormValues) => {
    if (!worker) return;

    await updateMutation.mutateAsync({
      ...values,
      id: worker.id,
      workspaceId,
      active: worker.active,
    });
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
          title={worker.name}
          desc={worker.description || undefined}
          actions={
            <div className="flex items-center space-x-2">
              <Badge variant={worker.active ? 'default' : 'secondary'}>
                {worker.active ? t('Active') : t('Inactive')}
              </Badge>

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

                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="icon"
                      Icon={LuPencil}
                      onClick={() => setIsEditing(true)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      Icon={LuX}
                      onClick={() => setIsEditing(false)}
                    />
                  )}

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
                {isEditing ? (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Description')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('JavaScript Code')}</FormLabel>
                            <FormControl>
                              <CodeEditor
                                height={400}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button
                          type="submit"
                          Icon={LuSave}
                          loading={updateMutation.isPending}
                        >
                          {t('Save Changes')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          {t('Cancel')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <CodeEditor
                      readOnly={true}
                      height={400}
                      value={worker.code}
                      onChange={() => {}} // Read-only
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Recent Executions')}</CardTitle>
              </CardHeader>
              <CardContent>
                {executions?.executions && executions.executions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead>{t('Duration')}</TableHead>
                        <TableHead>{t('Memory Used')}</TableHead>
                        <TableHead>{t('CPU Time')}</TableHead>
                        <TableHead>{t('Created At')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executions.executions.map((execution: any) => (
                        <TableRow key={execution.id}>
                          <TableCell>
                            <Badge
                              variant={
                                execution.status === 'Success'
                                  ? 'default'
                                  : execution.status === 'Failed'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {execution.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {execution.duration
                              ? `${execution.duration}ms`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {execution.memoryUsed
                              ? `${Math.round(execution.memoryUsed / 1024)}KB`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {execution.cpuTime
                              ? `${Math.round(execution.cpuTime / 1000000)}ms`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {dayjs(execution.createdAt).format(
                              'YYYY-MM-DD HH:mm:ss'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    {t('No executions yet')}
                  </div>
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
              {executionResult?.status === 'Success' ? (
                <LuCheck className="h-5 w-5 text-green-500" />
              ) : (
                <LuX className="h-5 w-5 text-red-500" />
              )}
              <span>{t('Execution Result')}</span>
            </DialogTitle>
          </DialogHeader>

          {executionResult && (
            <div className="space-y-4 overflow-hidden">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('Status')}</label>
                  <div>
                    <Badge
                      variant={
                        executionResult.status === 'Success'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {executionResult.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('Duration')}</label>
                  <div className="text-sm">
                    {executionResult.duration
                      ? `${executionResult.duration}ms`
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {t('Memory Used')}
                  </label>
                  <div className="text-sm">
                    {executionResult.memoryUsed
                      ? `${Math.round(executionResult.memoryUsed / 1024)}KB`
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('CPU Time')}</label>
                  <div className="text-sm">
                    {executionResult.cpuTime
                      ? `${Math.round(executionResult.cpuTime / 1000000)}ms`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Response Result */}
              {executionResult.responsePayload !== null && (
                <div>
                  <label className="text-sm font-medium">{t('Response')}</label>
                  <div className="bg-muted mt-1 max-h-[400px] overflow-auto rounded-md p-3">
                    <code className="text-sm">
                      {typeof executionResult.responsePayload === 'string'
                        ? executionResult.responsePayload
                        : JSON.stringify(
                            executionResult.responsePayload,
                            null,
                            2
                          )}
                    </code>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {executionResult.error && (
                <div>
                  <label className="text-sm font-medium text-red-600">
                    {t('Error')}
                  </label>
                  <div className="mt-1 rounded-md border border-red-200 bg-red-50 p-3">
                    <code className="text-sm text-red-800">
                      {executionResult.error}
                    </code>
                  </div>
                </div>
              )}

              {/* Logs */}
              {executionResult.logs && executionResult.logs.length > 0 && (
                <div>
                  <label className="text-sm font-medium">{t('Logs')}</label>
                  <ScrollArea className="mt-1 h-32 rounded-md bg-gray-900 p-3 text-gray-100">
                    {executionResult.logs.map((log: string, index: number) => (
                      <div key={index} className="font-mono text-sm">
                        {log}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CommonWrapper>
  );
}
