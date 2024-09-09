import { Button, Empty, Select, SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';

interface FeedChannelPickerProps extends SelectProps<string | string[]> {}
export const FeedChannelPicker: React.FC<FeedChannelPickerProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const { data: allChannels = [] } = trpc.feed.channels.useQuery({
      workspaceId,
    });

    const options = useMemo(
      () =>
        allChannels.map((m) => ({
          label: m.name,
          value: m.id,
        })),
      [allChannels]
    );

    return (
      <Select
        notFoundContent={
          <Empty
            description={
              <div className="py-2">
                <div className="mb-1">{t('Not found any feed channel')}</div>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    navigate({
                      to: '/feed/add',
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
        optionFilterProp="label"
      />
    );
  }
);
FeedChannelPicker.displayName = 'FeedChannelPicker';
