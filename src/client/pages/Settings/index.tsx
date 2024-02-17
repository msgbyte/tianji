import { Menu, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WebsiteInfo } from '../../components/website/WebsiteInfo';
import { WebsiteList } from '../../components/website/WebsiteList';
import { useEvent } from '../../hooks/useEvent';
import { NotificationList } from './NotificationList';
import { Profile } from './Profile';
import { AuditLog } from './AuditLog';
import { Trans } from '@i18next-toolkit/react';
import { compact } from 'lodash-es';
import { useGlobalConfig } from '../../hooks/useConfig';
import { Usage } from './Usage';

export const SettingsPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { alphaMode } = useGlobalConfig();

  const onClick: MenuProps['onClick'] = useEvent((e) => {
    navigate(`/settings/${e.key}`);
  });

  const items: MenuProps['items'] = useMemo(
    () =>
      compact([
        {
          key: 'websites',
          label: <Trans>Websites</Trans>,
        },
        {
          key: 'notifications',
          label: <Trans>Notifications</Trans>,
        },
        {
          key: 'auditLog',
          label: <Trans>Audit Log</Trans>,
        },
        {
          key: 'profile',
          label: <Trans>Profile</Trans>,
        },
        alphaMode && {
          key: 'usage',
          label: <Trans>Usage</Trans>,
        },
      ]),
    [alphaMode]
  );

  const selectedKey =
    (items.find((item) => pathname.startsWith(`/settings/${item?.key}`))
      ?.key as string) ?? 'websites';

  return (
    <div className="flex h-full">
      <div className="w-full md:w-1/6 pt-10">
        <Menu
          className="h-full"
          onClick={onClick}
          selectedKeys={[selectedKey]}
          mode="vertical"
          items={items}
        />
      </div>
      <div className="w-full md:w-5/6 py-2 px-4">
        <Routes>
          <Route path="/" element={<WebsiteList />} />
          <Route path="/websites" element={<WebsiteList />} />
          <Route path="/website/:websiteId" element={<WebsiteInfo />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/auditLog" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />

          {alphaMode && <Route path="/usage" element={<Usage />} />}
        </Routes>
      </div>
    </div>
  );
});
SettingsPage.displayName = 'SettingsPage';
