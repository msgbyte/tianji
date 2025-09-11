import { Button, Empty, Select, SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';

interface NotificationPickerProps extends SelectProps<string[]> {}

/**
 * @deprecated Use NotificationPickerV2 instead
 */
export const NotificationPicker: React.FC<NotificationPickerProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const { data: allNotification = [] } = trpc.notification.all.useQuery({
      workspaceId,
    });

    const options = useMemo(
      () =>
        allNotification.map((notification) => ({
          label: (
            <div>
              <ColorTag label={notification.type} />
              {notification.name}
            </div>
          ),
          value: notification.id,
          desc: notification.name,
        })),
      [allNotification]
    );

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
        options={options}
        optionFilterProp="desc"
      />
    );
  }
);
NotificationPicker.displayName = 'NotificationPicker';
