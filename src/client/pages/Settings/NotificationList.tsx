import { PlusOutlined } from '@ant-design/icons';
import { Button, List } from 'antd';
import React, { useState } from 'react';
import {
  NotificationFormValues,
  NotificationInfoModal,
} from '../../components/modals/NotificationInfo';
import { PageHeader } from '../../components/PageHeader';
import { useEvent } from '../../hooks/useEvent';

export const NotificationList: React.FC = React.memo(() => {
  const [open, setOpen] = useState(false);

  const handleSubmit = useEvent((values: NotificationFormValues) => {
    console.log('ok', values);
    setOpen(false);
  });

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
              onClick={() => setOpen(true)}
            >
              New
            </Button>
          </div>
        }
      />

      <List
        bordered={true}
        dataSource={[
          { id: '1', name: 'Email Notify' },
          { id: '1', name: 'Email Notify' },
          { id: '1', name: 'Email Notify' },
        ]}
        renderItem={(item) => (
          <List.Item actions={[<Button>edit</Button>]}>
            <List.Item.Meta title={item.name} />
          </List.Item>
        )}
      />

      <NotificationInfoModal
        open={open}
        onSubmit={handleSubmit}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
});
NotificationList.displayName = 'NotificationList';
