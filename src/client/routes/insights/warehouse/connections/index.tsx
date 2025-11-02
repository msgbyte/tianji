import { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertConfirm } from '@/components/AlertConfirm';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { useEvent } from '@/hooks/useEvent';
import { LuFilePen, LuPlus, LuTrash2, LuSearch } from 'react-icons/lu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/insights/warehouse/connections/')({
  component: PageComponent,
});

type ConnectionItem = {
  id: string;
  name: string;
  description: string;
  dbDriver: string;
  createdAt: string;
  updatedAt: string;
};

interface ConnectionFormValues {
  id?: string;
  name: string;
  description: string;
  dbDriver: string;
}

function PageComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();

  const {
    data: connections = [],
    isLoading,
    refetch,
  } = trpc.insights.warehouse.database.list.useQuery({ workspaceId });

  const upsertMutation = trpc.insights.warehouse.database.upsert.useMutation({
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.insights.warehouse.database.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const [open, setOpen] = useState(false);
  const [editingFormData, setEditingFormData] = useState<
    ConnectionFormValues | undefined
  >();

  const handleOpenEdit = useEvent((init: ConnectionItem) => {
    setEditingFormData({
      id: init.id,
      name: init.name,
      description: init.description ?? '',
      dbDriver: init.dbDriver ?? 'mysql',
    });
    setOpen(true);
  });

  const handleClose = useEvent(() => {
    setEditingFormData(undefined);
    setOpen(false);
  });

  const handleSubmit = useEvent(async () => {
    if (!editingFormData) {
      return;
    }
    if (!editingFormData.name.trim()) {
      toast.error(t('Please complete required fields'));
      return;
    }

    await upsertMutation.mutateAsync({
      workspaceId,
      id: editingFormData.id,
      name: editingFormData.name.trim(),
      description: editingFormData.description ?? '',
      dbDriver: editingFormData.dbDriver ?? 'mysql',
    });

    handleClose();
    refetch?.();
  });

  const handleDelete = useEvent(async (id: string) => {
    await deleteMutation.mutateAsync({ workspaceId, id });
    refetch?.();
  });

  const headerActions = useMemo(() => {
    if (!hasAdminPermission) return null;
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          Icon={LuPlus}
          onClick={() =>
            navigate({ to: '/insights/warehouse/connections/create' })
          }
        >
          {t('New')}
        </Button>
      </div>
    );
  }, [hasAdminPermission]);

  return (
    <CommonWrapper
      header={<CommonHeader title={t('Connections')} actions={headerActions} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        {isLoading ? (
          <div className="p-4 text-sm text-zinc-500">{t('Loading...')}</div>
        ) : connections.length === 0 ? (
          <div className="m-2 rounded-md border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            {t('No data')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(connections as unknown as ConnectionItem[]).map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                  <CardTitle className="truncate text-base">
                    {item.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      Icon={LuSearch}
                      onClick={() =>
                        navigate({
                          to: '/insights/warehouse/$databaseId/query',
                          params: { databaseId: item.id },
                        })
                      }
                    >
                      {t('Query')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: '/insights/warehouse/connections/$connectionId/table',
                          params: { connectionId: item.id },
                        })
                      }
                    >
                      {t('Tables')}
                    </Button>
                    {hasAdminPermission && (
                      <Button
                        size="sm"
                        variant="secondary"
                        Icon={LuFilePen}
                        onClick={() => handleOpenEdit(item)}
                      >
                        {t('Edit')}
                      </Button>
                    )}
                    {hasAdminPermission && (
                      <AlertConfirm
                        title={t('Is delete this item?')}
                        onConfirm={() => handleDelete(item.id)}
                      >
                        <Button variant="destructive" size="icon">
                          <LuTrash2 />
                        </Button>
                      </AlertConfirm>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {item.description && (
                    <div className="text-muted-foreground line-clamp-2 text-sm">
                      {item.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {item.dbDriver.toUpperCase()}
                    </Badge>
                  </div>
                  {/* hide connectionUri for security concerns */}
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
              <DialogTitle>{t('Edit connection')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Name')}</Label>
                <Input
                  value={editingFormData?.name ?? ''}
                  onChange={(e) =>
                    setEditingFormData((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Description')}</Label>
                <Textarea
                  rows={4}
                  value={editingFormData?.description ?? ''}
                  onChange={(e) =>
                    setEditingFormData((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('Cancel')}
              </Button>
              <Button onClick={handleSubmit}>{t('Confirm')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ScrollArea>
    </CommonWrapper>
  );
}
