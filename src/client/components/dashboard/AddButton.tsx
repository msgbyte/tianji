import { Button, Dropdown, Space } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useDashboardStore } from '../../store/dashboard';
import { DownOutlined } from '@ant-design/icons';

export const DashboardItemAddButton: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const { data: websites = [], isLoading } = trpc.website.all.useQuery({
    workspaceId,
  });
  const { addItem } = useDashboardStore();

  return (
    <div>
      <Dropdown
        trigger={['click']}
        disabled={isLoading}
        menu={{
          items: [
            {
              key: 'website',
              label: 'website',
              children: websites.map((website) => ({
                key: `website#${website.id}`,
                label: website.name,
                children: [
                  {
                    key: `website#${website.id}#overview`,
                    label: 'overview',
                    onClick: () => {
                      addItem(
                        'websiteOverview',
                        website.id,
                        `${website.name}'s Overview`
                      );
                    },
                  },
                ],
              })),
            },
          ],
        }}
      >
        <Button type="primary" size="large" className="w-32">
          <Space>
            <span>Add</span>
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
    </div>
  );
});
DashboardItemAddButton.displayName = 'DashboardItemAddButton';
