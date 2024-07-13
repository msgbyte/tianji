import { Button, Empty, Select, SelectProps } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';

interface NotificationPickerProps extends SelectProps<string[]> {}
export const NotificationPicker: React.FC<NotificationPickerProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
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
                <div className="mb-1">{t('Not found any notification')}</div>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    navigate({
                      to: '/settings/notifications',
                    })
                  }
                >
                  {t('Create Now')}
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
