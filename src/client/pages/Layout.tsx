import React, { useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { NavItem } from '../components/NavItem';
import { MobileNavItem } from '../components/MobileNavItem';
import { UserOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Dropdown } from 'antd';
import { useUserStore } from '../store/user';
import { useLogout } from '../api/model/user';
import { ColorSchemeSwitcher } from '../components/ColorSchemeSwitcher';
import { version } from '@tianji/shared';
import { useIsMobile } from '../hooks/useIsMobile';
import { RiMenuUnfoldLine } from 'react-icons/ri';

export const Layout: React.FC = React.memo(() => {
  const [params] = useSearchParams();
  const workspaces = useUserStore((state) => {
    const userInfo = state.info;
    if (userInfo) {
      return userInfo.workspaces.map((w) => ({
        id: w.workspace.id,
        name: w.workspace.name,
        role: w.role,
        current: userInfo.currentWorkspace?.id === w.workspace.id,
      }));
    }

    return [];
  });
  const [openDraw, setOpenDraw] = useState(false);
  const logout = useLogout();
  const isMobile = useIsMobile();
  const showHeader = !params.has('hideHeader');
  const navigate = useNavigate();

  const accountEl = (
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
            key: 'settings',
            label: 'Settings',
            onClick: () => {
              navigate('/settings');
            },
          },
          {
            key: 'logout',
            label: 'Logout',
            onClick: () => {
              logout();
            },
          },
          {
            type: 'divider',
          },
          {
            key: 'version',
            label: `v${version}`,
            disabled: true,
          },
        ],
      }}
    >
      <Button shape="circle" size="large" icon={<UserOutlined />} />
    </Dropdown>
  );

  return (
    <div className="flex flex-col h-full dark:bg-gray-900 dark:text-gray-300">
      {showHeader && (
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-4 sticky top-0 z-20 h-[62px]">
          {isMobile && (
            <>
              <Button
                className="mr-2"
                icon={<RiMenuUnfoldLine className="anticon" />}
                onClick={() => setOpenDraw(true)}
              />
              <Drawer
                open={openDraw}
                onClose={() => setOpenDraw(false)}
                placement="left"
                closeIcon={false}
              >
                <div className="flex flex-col h-full pt-12">
                  <div className="flex-1">
                    <MobileNavItem
                      to="/dashboard"
                      label="Dashboard"
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/monitor"
                      label="Monitor"
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/website"
                      label="Website"
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/servers"
                      label="Servers"
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/settings"
                      label="Settings"
                      onClick={() => setOpenDraw(false)}
                    />
                  </div>

                  <Divider />

                  <div className="flex justify-between">
                    <ColorSchemeSwitcher />
                    {accountEl}
                  </div>
                </div>
              </Drawer>
            </>
          )}

          <div className="px-2 mr-10 font-bold flex items-center">
            <img src="/icon.svg" className="w-10 h-10 mr-2" />
            <span className="text-xl dark:text-gray-200">Tianji</span>
          </div>

          {!isMobile && (
            <>
              <div className="flex gap-8">
                <NavItem to="/dashboard" label="Dashboard" />
                <NavItem to="/monitor" label="Monitor" />
                <NavItem to="/website" label="Website" />
                <NavItem to="/servers" label="Servers" />
                <NavItem to="/settings" label="Settings" />
              </div>

              <div className="flex-1" />

              <div className="flex gap-2">
                <ColorSchemeSwitcher />

                {accountEl}
              </div>
            </>
          )}
        </div>
      )}
      <div className="flex-1 w-full overflow-hidden">
        <div className="h-full px-1 sm:px-4 overflow-auto">
          <div className="max-w-7xl m-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
});
Layout.displayName = 'Layout';
