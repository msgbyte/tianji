import { Button, Dropdown, MenuProps, Space } from 'antd';
import React, { useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useDashboardStore } from '../../store/dashboard';
import { DownOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { useTranslation } from '@i18next-toolkit/react';

export const DashboardItemAddButton: React.FC = React.memo(() => {
  const { t } = useTranslation();
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
  const [open, setOpen] = useState(false);

  const isLoading = isWebsiteLoading || isMonitorLoading;

  const menu: MenuProps = {
    items: [
      {
        key: 'website',
        label: t('Website'),
        children:
          websites.length > 0
            ? websites.map((website) => ({
                key: `website#${website.id}`,
                label: website.name,
                children: [
                  {
                    key: `website#${website.id}#overview`,
                    label: t('Overview'),
                    onClick: () => {
                      addItem(
                        'websiteOverview',
                        website.id,
                        `${website.name}'s Overview`
                      );
                    },
                  },
                  {
                    key: `website#${website.id}#events`,
                    label: t('Events'),
                    onClick: () => {
                      addItem(
                        'websiteEvents',
                        website.id,
                        `${website.name}'s Events`
                      );
                    },
                  },
                ],
              }))
            : [
                {
                  key: `website#none`,
                  label: t('(None)'),
                  disabled: true,
                },
              ],
      },
      {
        key: 'monitor',
        label: t('Monitor'),
        children:
          monitors.length > 0
            ? monitors.map((monitor) => ({
                key: `monitor#${monitor.id}`,
                label: monitor.name,
                children: [
                  {
                    key: `monitor#${monitor.id}#healthBar`,
                    label: t('Health Bar'),
                    onClick: () => {
                      addItem(
                        'monitorHealthBar',
                        monitor.id,
                        t("{{monitorName}}'s Health", {
                          monitorName: monitor.name,
                        })
                      );
                    },
                  },
                  {
                    key: `monitor#${monitor.id}#metrics`,
                    label: t('Metrics'),
                    onClick: () => {
                      addItem(
                        'monitorMetrics',
                        monitor.id,
                        t("{{monitorName}}'s Metrics", {
                          monitorName: monitor.name,
                        })
                      );
                    },
                  },
                  {
                    key: `monitor#${monitor.id}#chart`,
                    label: t('Chart'),
                    onClick: () => {
                      addItem(
                        'monitorChart',
                        monitor.id,
                        t("{{monitorName}}'s Chart", {
                          monitorName: monitor.name,
                        })
                      );
                    },
                  },
                  {
                    key: `monitor#${monitor.id}#events`,
                    label: t('Events'),
                    onClick: () => {
                      addItem(
                        'monitorEvents',
                        monitor.id,
                        t("{{monitorName}}'s Events", {
                          monitorName: monitor.name,
                        })
                      );
                    },
                  },
                ],
              }))
            : [
                {
                  key: `monitor#none`,
                  label: t('(None)'),
                  disabled: true,
                },
              ],
      },
    ],
  };

  return (
    <div>
      <Dropdown
        trigger={['click']}
        disabled={isLoading}
        menu={menu}
        open={open}
        onOpenChange={setOpen}
      >
        <Button type="primary" size="large" className="w-32">
          <Space>
            <span>{t('Add')}</span>
            <DownOutlined
              className={clsx(
                'transition-transform scale-y-75',
                open && 'rotate-180'
              )}
            />
          </Space>
        </Button>
      </Dropdown>
    </div>
  );
});
DashboardItemAddButton.displayName = 'DashboardItemAddButton';
