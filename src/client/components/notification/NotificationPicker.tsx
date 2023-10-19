import { Select, SelectProps } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';

interface NotificationPickerProps extends SelectProps<string> {}
export const NotificationPicker: React.FC<NotificationPickerProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { data: allNotification = [] } = trpc.notification.all.useQuery({
      workspaceId,
    });

    return (
      <Select {...props}>
        {allNotification.map((m) => (
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
