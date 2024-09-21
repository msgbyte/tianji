import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, Popconfirm } from 'antd';
import { useState } from 'react';
import { trpc } from '../../api/trpc';
import {
  NotificationFormValues,
  NotificationInfoModal,
} from '../../components/modals/NotificationInfo';
import { useEvent } from '../../hooks/useEvent';
import { useCurrentWorkspaceId, useHasAdminPermission } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { Button } from '@/components/ui/button';
import { LuFileEdit, LuPlus, LuTrash2 } from 'react-icons/lu';
import { compact } from 'lodash-es';

export const Route = createFileRoute('/settings/notifications')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { data: list = [], refetch } = trpc.notification.all.useQuery({
    workspaceId: currentWorkspaceId!,
  });
  const [editingFormData, setEditingFormData] = useState<
    NotificationFormValues | undefined
  >(undefined);
  const hasAdminPermission = useHasAdminPermission();

  const upsertMutation = trpc.notification.upsert.useMutation();
  const deleteMutation = trpc.notification.delete.useMutation();

  const handleOpenModal = useEvent((initValues?: NotificationFormValues) => {
    setEditingFormData(initValues);
    setOpen(true);
  });

  const handleCloseModal = useEvent(() => {
    setEditingFormData(undefined);
    setOpen(false);
  });

  const handleSubmit = useEvent(async (values: NotificationFormValues) => {
    await upsertMutation.mutateAsync({
      workspaceId: currentWorkspaceId!,
      ...values,
    });
    handleCloseModal();
    refetch();
  });

  const handleDelete = useEvent(async (notificationId: string) => {
    await deleteMutation.mutateAsync({
      workspaceId: currentWorkspaceId!,
      id: notificationId,
    });
    refetch();
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Notifications')}
          actions={
            <>
              {hasAdminPermission && (
                <Button
                  variant="outline"
                  Icon={LuPlus}
                  onClick={() => handleOpenModal()}
                >
                  {t('New')}
                </Button>
              )}
            </>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <div>
          <List
            bordered={true}
            dataSource={list}
            renderItem={(item) => (
              <List.Item
                actions={compact([
                  hasAdminPermission && (
                    <Button
                      variant="default"
                      Icon={LuFileEdit}
                      onClick={() => {
                        handleOpenModal({
                          id: item.id,
                          name: item.name,
                          type: item.type,
                          payload: item.payload as Record<string, any>,
                        });
                      }}
                    >
                      {t('Edit')}
                    </Button>
                  ),
                  hasAdminPermission && (
                    <Popconfirm
                      title={t('Is delete this item?')}
                      okButtonProps={{
                        danger: true,
                      }}
                      onConfirm={() => {
                        handleDelete(item.id);
                      }}
                    >
                      <Button variant="destructive" size="icon">
                        <LuTrash2 />
                      </Button>
                    </Popconfirm>
                  ),
                ])}
              >
                <List.Item.Meta title={item.name} />
              </List.Item>
            )}
          />

          <NotificationInfoModal
            key={editingFormData?.id}
            open={open}
            initialValues={editingFormData}
            onSubmit={handleSubmit}
            onCancel={() => handleCloseModal()}
          />
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
