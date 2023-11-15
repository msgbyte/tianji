import { Button, Dropdown, MenuProps, Space } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useDashboardStore } from '../../store/dashboard';
import { DownOutlined } from '@ant-design/icons';

export const DashboardItemAddButton: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const { data: websites = [], isLoading: isWebsiteLoading } =
    trpc.website.all.useQuery({
      workspaceId,
    });
  const { data: monitors = [], isLoading: isMonitorLoading } =
    trpc.monitor.all.useQuery({
      workspaceId,
    });
  const { addItem } = useDashboardStore();

  const isLoading = isWebsiteLoading || isMonitorLoading;

  const menu: MenuProps = {
    items: [
      {
        key: 'website',
        label: 'Website',
        children: websites.map((website) => ({
          key: `website#${website.id}`,
          label: website.name,
          children: [
            {
              key: `website#${website.id}#overview`,
              label: 'Overview',
              onClick: () => {
                addItem(
                  'websiteOverview',
                  website.id,
                  `${website.name}'s Overview`
                );
              },
            },
            {
              key: `website#${website.id}#event`,
              label: 'Events',
              onClick: () => {
                addItem('websiteEvent', website.id, `${website.name}'s Event`);
              },
            },
          ],
        })),
      },
      {
        key: 'monitor',
        label: 'Monitor',
        children: monitors.map((monitor) => ({
          key: `monitor#${monitor.id}`,
          label: monitor.name,
          children: [
            {
              key: `monitor#${monitor.id}#healthBar`,
              label: 'Health Bar',
              onClick: () => {
                addItem(
                  'monitorHealthBar',
                  monitor.id,
                  `${monitor.name}'s Health`
                );
              },
            },
          ],
        })),
      },
    ],
  };

  return (
    <div>
      <Dropdown trigger={['click']} disabled={isLoading} menu={menu}>
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
