import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { Layout } from '@/components/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertConfirm } from '@/components/AlertConfirm';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { useEvent } from '@/hooks/useEvent';
import { List, message } from 'antd';
import { compact } from 'lodash-es';
import { LuFilePen, LuPlus, LuTrash2, LuInfo } from 'react-icons/lu';
import { FilterSection } from '@/components/insights/FilterSection';
import { FilterInfo } from '@tianji/shared';

export const Route = createFileRoute('/insights/cohorts')({
  component: PageComponent,
});

type CohortItem = {
  id: string;
  name: string;
  warehouseApplicationId: string;
  filter: FilterInfo[];
};

interface CohortFormValues {
  id?: string;
  name: string;
  warehouseApplicationId?: string;
}

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();

  const { data: warehouseApplicationIds = [], isLoading: loadingApps } =
    trpc.insights.warehouseApplications.useQuery({ workspaceId });

  const { data: wideTableAppIds = [], isLoading: loadingWideApps } =
    trpc.insights.warehouseApplicationsWideTable.useQuery({ workspaceId });

  const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
  useEffect(() => {
    if (!selectedAppId && warehouseApplicationIds.length > 0) {
      setSelectedAppId(warehouseApplicationIds[0]);
    }
  }, [warehouseApplicationIds]);

  const {
    data: cohorts = [],
    refetch,
    isLoading,
  } = trpc.insights.cohorts.list.useQuery(
    {
      workspaceId,
    },
    {
      enabled: Boolean(selectedAppId),
    }
  );

  // mutations
  const upsertMutation = trpc.insights.cohorts.upsert.useMutation({
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.insights.cohorts.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const [open, setOpen] = useState(false);
  const [editingFormData, setEditingFormData] = useState<
    CohortFormValues | undefined
  >(undefined);
  const [filters, setFilters] = useState<(FilterInfo | null)[]>([]);

  const handleOpenModal = useEvent((init?: CohortItem) => {
    console.log('init', init);
    setEditingFormData(
      init
        ? {
            id: init.id,
            name: init.name,
            warehouseApplicationId: init.warehouseApplicationId,
          }
        : {
            name: '',
            warehouseApplicationId: wideTableAppIds.includes(
              selectedAppId ?? ''
            )
              ? selectedAppId
              : wideTableAppIds[0],
          }
    );
    setFilters(init?.filter ?? []);
    setOpen(true);
  });

  const handleCloseModal = useEvent(() => {
    setEditingFormData(undefined);
    setOpen(false);
  });

  const handleSubmit = useEvent(async () => {
    if (!editingFormData) return;

    const targetAppId = editingFormData.warehouseApplicationId ?? selectedAppId;
    if (!targetAppId) {
      message.error(t('Please select application'));
      return;
    }
    if (!wideTableAppIds.includes(targetAppId)) {
      message.error(t('Only wideTable application is supported'));
      return;
    }

    await upsertMutation.mutateAsync({
      workspaceId,
      id: editingFormData.id,
      name: editingFormData.name,
      warehouseApplicationId: targetAppId,
      filter: filters,
    });

    handleCloseModal();
    refetch?.();
  });

  const handleDelete = useEvent(async (id: string) => {
    if (!deleteMutation) return;
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
          disabled={loadingWideApps || wideTableAppIds.length === 0}
          onClick={() => handleOpenModal()}
        >
          {t('New')}
        </Button>
      </div>
    );
  }, [hasAdminPermission, loadingWideApps, wideTableAppIds.length]);

  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader
            title={t('Cohorts')}
            actions={headerActions}
            tip={
              <div className="flex items-center gap-2">
                <LuInfo />
                <span>
                  {t(
                    'Only warehouse application with type "wideTable" supports cohorts.'
                  )}
                </span>
              </div>
            }
          />
        }
      >
        <ScrollArea className="h-full overflow-hidden p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="text-muted-foreground min-w-36 text-sm">
              {t('Application')}
            </div>
            <Select
              value={selectedAppId}
              onValueChange={(v) => setSelectedAppId(v)}
              disabled={loadingApps}
            >
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder={t('Select application')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Warehouse Applications')}</SelectLabel>
                  {warehouseApplicationIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <List
            bordered
            loading={isLoading}
            dataSource={(cohorts as unknown as CohortItem[]) ?? []}
            locale={{ emptyText: t('No data') as unknown as string }}
            renderItem={(item: CohortItem) => (
              <List.Item
                actions={compact([
                  hasAdminPermission && (
                    <Button
                      key="edit"
                      variant="default"
                      Icon={LuFilePen}
                      onClick={() => handleOpenModal(item)}
                    >
                      {t('Edit')}
                    </Button>
                  ),
                  hasAdminPermission && (
                    <AlertConfirm
                      key="delete"
                      title={t('Is delete this item?')}
                      onConfirm={() => handleDelete(item.id)}
                    >
                      <Button variant="destructive" size="icon">
                        <LuTrash2 />
                      </Button>
                    </AlertConfirm>
                  ),
                ])}
              >
                <List.Item.Meta
                  title={item.name}
                  description={
                    <div className="text-muted-foreground text-xs">
                      {item.warehouseApplicationId}
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          <Dialog
            open={open}
            onOpenChange={(v) => (!v ? handleCloseModal() : setOpen(v))}
          >
            <DialogContent className="z-40" overlayClassName="z-40">
              <DialogHeader>
                <DialogTitle>
                  {editingFormData?.id ? t('Edit cohort') : t('New cohort')}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Application')}</Label>
                  <Select
                    value={editingFormData?.warehouseApplicationId ?? ''}
                    onValueChange={(v) => {
                      setEditingFormData((prev) =>
                        prev ? { ...prev, warehouseApplicationId: v } : prev
                      );
                    }}
                    disabled={Boolean(editingFormData?.id) || loadingWideApps}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('Select application')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t('Warehouse Applications')}</SelectLabel>
                        {wideTableAppIds.map((id) => (
                          <SelectItem key={id} value={id}>
                            {id}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>{t('Filter')}</Label>
                  <div className="overflow-hidden">
                    <FilterSection
                      direction="horizontal"
                      insightId={editingFormData?.warehouseApplicationId ?? ''}
                      insightType={'warehouse'}
                      filters={filters}
                      onSetFilter={(index, info) => {
                        setFilters((prev) => {
                          const next = [...prev];
                          next[index] = info;
                          return next;
                        });
                      }}
                      onAddFilter={() => {
                        setFilters((prev) => [...prev, null]);
                      }}
                      onRemoveFilter={(index) => {
                        setFilters((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseModal}>
                  {t('Cancel')}
                </Button>
                <Button onClick={handleSubmit}>{t('Confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ScrollArea>
      </CommonWrapper>
    </Layout>
  );
}
