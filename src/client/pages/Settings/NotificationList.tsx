import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, List, Popconfirm } from 'antd';
import React, { useState } from 'react';
import { trpc } from '../../api/trpc';
import {
  NotificationFormValues,
  NotificationInfoModal,
} from '../../components/modals/NotificationInfo';
import { NoWorkspaceTip } from '../../components/NoWorkspaceTip';
import { PageHeader } from '../../components/PageHeader';
import { useEvent } from '../../hooks/useEvent';
import { useCurrentWorkspaceId } from '../../store/user';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationList: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { data: list = [], refetch } = trpc.notification.all.useQuery({
    workspaceId: currentWorkspaceId!,
  });
  const [editingFormData, setEditingFormData] = useState<
    NotificationFormValues | undefined
  >(undefined);

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

  if (!currentWorkspaceId) {
    return <NoWorkspaceTip />;
  }

  return (
    <div>
      <PageHeader
        title={t('Notification List')}
        action={
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => handleOpenModal()}
            >
              {t('New')}
            </Button>
          </div>
        }
      />

      <List
        bordered={true}
        dataSource={list}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                icon={<EditOutlined />}
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
              </Button>,
              <Popconfirm
                title={t('Is delete this item?')}
                okButtonProps={{
                  danger: true,
                }}
                onConfirm={() => {
                  handleDelete(item.id);
                }}
              >
                <Button danger={true} icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
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
  );
});
NotificationList.displayName = 'NotificationList';
