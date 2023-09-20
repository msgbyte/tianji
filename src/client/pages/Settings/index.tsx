import { Menu, MenuProps } from 'antd';
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WebsiteInfo } from '../../components/WebsiteInfo';
import { WebsiteList } from '../../components/WebsiteList';
import { useEvent } from '../../hooks/useEvent';

export const SettingsPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items: MenuProps['items'] = [
    {
      key: 'websites',
      label: 'Websites',
    },
  ];

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
        </Routes>
      </div>
    </div>
  );
});
SettingsPage.displayName = 'SettingsPage';
