import { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Layout } from '@/components/layout';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertConfirm } from '@/components/AlertConfirm';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { useEvent } from '@/hooks/useEvent';
import {
  LuFilePen,
  LuPlus,
  LuTrash2,
  LuArrowLeft,
  LuRefreshCw,
} from 'react-icons/lu';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export const Route = createFileRoute(
  '/insights/warehouse/connections/$connectionId/table'
)({
  component: PageComponent,
});

type TableItem = {
  id: string;
  name: string;
  description: string;
  ddl: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

const tableSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  ddl: z.string().optional().default(''),
  prompt: z.string().optional().default(''),
});
type TableFormValues = z.infer<typeof tableSchema>;

function PageComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { connectionId } = Route.useParams();

  const {
    data: tables = [],
    isLoading,
    refetch,
  } = trpc.insights.warehouse.table.list.useQuery({ workspaceId });

  const upsertMutation = trpc.insights.warehouse.table.upsert.useMutation({
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.insights.warehouse.table.delete.useMutation({
    onError: defaultErrorHandler,
  });
  const syncMutation = trpc.insights.warehouse.database.sync.useMutation({
    onError: defaultErrorHandler,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableItem | null>(null);
  const [keyword, setKeyword] = useState('');

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: '',
      description: '',
      ddl: '',
      prompt: '',
    },
  });

  const handleOpenCreate = useEvent(() => {
    setEditing(null);
    form.reset({ name: '', description: '', ddl: '', prompt: '' });
    setOpen(true);
  });

  const handleOpenEdit = useEvent((item: TableItem) => {
    setEditing(item);
    form.reset({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      ddl: item.ddl ?? '',
      prompt: item.prompt ?? '',
    });
    setOpen(true);
  });

  const handleClose = useEvent(() => {
    setOpen(false);
  });

  const handleSync = useEvent(async () => {
    await syncMutation.mutateAsync({
      workspaceId,
      id: connectionId,
    });
    refetch?.();
  });

  const onSubmit = useEvent(async (values: TableFormValues) => {
    await upsertMutation.mutateAsync({
      workspaceId,
      id: values.id,
      databaseId: connectionId,
      name: values.name,
      description: values.description ?? '',
      ddl: values.ddl ?? '',
      prompt: values.prompt ?? '',
    });
    setOpen(false);
    refetch?.();
  });

  const handleDelete = useEvent(async (id: string) => {
    await deleteMutation.mutateAsync({ workspaceId, id });
    refetch?.();
  });

  const headerActions = useMemo(() => {
    if (!hasAdminPermission) {
      return null;
    }
    return (
      <div className="flex items-center gap-2">
        {connectionId && (
          <AlertConfirm
            title={t('Sync tables from database?')}
            content={t(
              'This will sync the existing table information and remove the ones that no longer exist.'
            )}
            onConfirm={handleSync}
          >
            <Button loading={syncMutation.isPending} Icon={LuRefreshCw}>
              {t('Sync')}
            </Button>
          </AlertConfirm>
        )}
        <Button variant="outline" Icon={LuPlus} onClick={handleOpenCreate}>
          {t('New')}
        </Button>
      </div>
    );
  }, [hasAdminPermission]);

  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader title={t('Database Tables')} actions={headerActions} />
        }
      >
        <ScrollArea className="h-full overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between gap-2 p-1">
            <Button
              variant="ghost"
              Icon={LuArrowLeft}
              onClick={() =>
                navigate({ to: '/insights/warehouse/connections' })
              }
            >
              {t('Back')}
            </Button>
            <div className="flex items-center gap-2">
              <Input
                className="w-96"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('Filter tables by name or description')}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="p-4 text-sm text-zinc-500">{t('Loading...')}</div>
          ) : tables.length === 0 ? (
            <div className="m-2 rounded-md border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
              {t('No data')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {(tables || [])
                .filter((item) => {
                  const k = keyword.trim().toLowerCase();
                  if (!k) return true;
                  return (
                    item.name.toLowerCase().includes(k) ||
                    (item.description || '').toLowerCase().includes(k)
                  );
                })
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                      <CardTitle className="truncate text-base">
                        {item.name}
                      </CardTitle>
                      {hasAdminPermission && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            Icon={LuFilePen}
                            onClick={() => handleOpenEdit(item)}
                          >
                            {t('Edit')}
                          </Button>
                          <AlertConfirm
                            title={t('Is delete this item?')}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <Button variant="destructive" size="icon">
                              <LuTrash2 />
                            </Button>
                          </AlertConfirm>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0">
                      {item.description && (
                        <div className="text-muted-foreground line-clamp-2 text-sm">
                          {item.description}
                        </div>
                      )}
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                        <div className="line-clamp-3 whitespace-pre-wrap">
                          {item.ddl || t('No DDL saved')}
                        </div>
                      </div>
                      {item.updatedAt && (
                        <div className="text-muted-foreground text-[11px]">
                          {t('Updated at')}:{' '}
                          {new Date(item.updatedAt).toLocaleString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          <Dialog
            open={open}
            onOpenChange={(v) => (!v ? handleClose() : setOpen(v))}
          >
            <DialogContent className="z-40" overlayClassName="z-40">
              <DialogHeader>
                <DialogTitle>
                  {editing ? t('Edit table') : t('New table')}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Name')}</FormLabel>
                        <FormControl>
                          <Input disabled={true} {...field} />
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
                        <FormLabel optional={true}>
                          {t('Description')}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ddl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel optional={true}>{t('DDL')}</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            className="font-mono"
                            disabled={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel optional={true}>{t('Prompt')}</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      {t('Cancel')}
                    </Button>
                    <Button type="submit" loading={form.formState.isSubmitting}>
                      {t('Confirm')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </ScrollArea>
      </CommonWrapper>
    </Layout>
  );
}
