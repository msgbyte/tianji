import { Button, Empty, Select, SelectProps } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';
import { useNavigate } from 'react-router';
import { PlusOutlined } from '@ant-design/icons';

interface NotificationPickerProps extends SelectProps<string> {}
export const NotificationPicker: React.FC<NotificationPickerProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const { data: allNotification = [] } = trpc.notification.all.useQuery({
      workspaceId,
    });

    return (
      <Select
        notFoundContent={
          <Empty
            description={
              <div className="py-2">
                <div className="mb-1">Not found any notification</div>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/settings/notifications')}
                >
                  Create Now
                </Button>
              </div>
            }
          />
        }
        {...props}
      >
        {allNotification.map((m: any) => (
          <Select.Option key={m.id} value={m.id}>
            <ColorTag label={m.type} />
            {m.name}
          </Select.Option>
        ))}
      </Select>
    );
  }
);
NotificationPicker.displayName = 'NotificationPicker';
