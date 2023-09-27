import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, List } from 'antd';
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

export const NotificationList: React.FC = React.memo(() => {
  const [open, setOpen] = useState(false);
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { data: list = [], refetch } = trpc.notification.getAll.useQuery({
    workspaceId: currentWorkspaceId!,
  });
  const [editingFormData, setEditingFormData] = useState<
    NotificationFormValues | undefined
  >(undefined);

  const mutation = trpc.notification.upsert.useMutation();

  const handleOpenModal = useEvent((initValues?: NotificationFormValues) => {
    console.log('initValues', initValues);
    setEditingFormData(initValues);
    setOpen(true);
  });

  const handleCloseModal = useEvent(() => {
    setEditingFormData(undefined);
    setOpen(false);
  });

  const handleSubmit = useEvent(async (values: NotificationFormValues) => {
    await mutation.mutateAsync({
      workspaceId: currentWorkspaceId!,
      ...values,
    });
    handleCloseModal();
    refetch();
  });

  if (!currentWorkspaceId) {
    return <NoWorkspaceTip />;
  }

  return (
    <div>
      <PageHeader
        title="Notification List"
        action={
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => handleOpenModal()}
            >
              New
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
                Edit
              </Button>,
            ]}
          >
            <List.Item.Meta title={item.name} />
          </List.Item>
        )}
      />

      <NotificationInfoModal
        open={open}
        initialValues={editingFormData}
        onSubmit={handleSubmit}
        onCancel={() => handleCloseModal()}
      />
    </div>
  );
});
NotificationList.displayName = 'NotificationList';
