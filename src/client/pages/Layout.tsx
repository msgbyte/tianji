import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavItem } from '../components/NavItem';
import { UserOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';

export const Layout: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center bg-gray-100 px-4">
        <div className="px-2 mr-10 font-bold">Tianji</div>
        <div className="flex gap-8">
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/monitor" label="Monitor" />
          <NavItem to="/website" label="Website" />
          <NavItem to="/Servers" label="Servers" />
          <NavItem to="/settings" label="Settings" />
        </div>

        <div className="flex-1" />

        <div>
          <Dropdown
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'logout',
                  label: 'Logout',
                },
              ],
            }}
          >
            <Button shape="circle" size="large" icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </div>
      <div className="flex-1 w-full max-w-7xl m-auto px-4 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
});
Layout.displayName = 'Layout';
