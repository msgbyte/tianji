import React from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { NavItem } from '../components/NavItem';
import { UserOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { useUserStore } from '../store/user';

export const Layout: React.FC = React.memo(() => {
  const [params] = useSearchParams();
  const workspaces = useUserStore((state) => {
    const userInfo = state.info;
    if (userInfo) {
      return userInfo.workspaces.map((w) => ({
        id: w.workspace.id,
        name: w.workspace.name,
        role: w.role,
        current: userInfo.currentWorkspace.id === w.workspace.id,
      }));
    }

    return [];
  });
  const showHeader = !params.has('hideHeader');

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center bg-gray-100 px-4 sticky top-0 z-20">
          <div className="px-2 mr-10 font-bold flex items-center">
            <img src="/icon.svg" className="w-10 h-10 mr-2" />
            <span className="text-xl">Tianji</span>
          </div>
          <div className="flex gap-8">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/monitor" label="Monitor" />
            <NavItem to="/website" label="Website" />
            <NavItem to="/servers" label="Servers" />
            <NavItem to="/settings" label="Settings" />
          </div>

          <div className="flex-1" />

          <div>
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'workspaces',
                    label: 'Workspaces',
                    children: workspaces.map((w) => ({
                      key: w.id,
                      label: `${w.name}${w.current ? '(current)' : ''}`,
                      disabled: w.current,
                    })),
                  },
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
      )}
      <div className="flex-1 w-full px-4">
        <div className="max-w-7xl m-auto h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
});
Layout.displayName = 'Layout';
