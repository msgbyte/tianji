import { Menu, MenuProps } from 'antd';
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WebsiteInfo } from '../../components/website/WebsiteInfo';
import { WebsiteList } from '../../components/website/WebsiteList';
import { useEvent } from '../../hooks/useEvent';
import { NotificationList } from './NotificationList';
import { Profile } from './Profile';

const items: MenuProps['items'] = [
  {
    key: 'websites',
    label: 'Websites',
  },
  {
    key: 'notifications',
    label: 'Notifications',
  },
  {
    key: 'profile',
    label: 'Profile',
  },
];

export const SettingsPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onClick: MenuProps['onClick'] = useEvent((e) => {
    navigate(`/settings/${e.key}`);
  });

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
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
});
SettingsPage.displayName = 'SettingsPage';
