import React, { useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { NavItem } from '../components/NavItem';
import { MobileNavItem } from '../components/MobileNavItem';
import { UserOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Dropdown } from 'antd';
import { useUserStore } from '../store/user';
import { useLogout } from '../api/model/user';
import { ColorSchemeSwitcher } from '../components/ColorSchemeSwitcher';
import { version } from '@/utils/env';
import { useIsMobile } from '../hooks/useIsMobile';
import { RiMenuUnfoldLine } from 'react-icons/ri';
import { useTranslation } from '@i18next-toolkit/react';
import { LanguageSelector } from '../components/LanguageSelector';

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
  const { t } = useTranslation();

  const accountEl = (
    <Dropdown
      placement="bottomRight"
      menu={{
        items: [
          {
            key: 'workspaces',
            label: t('Workspaces'),
            children: workspaces.map((w) => ({
              key: w.id,
              label: `${w.name}${w.current ? '(current)' : ''}`,
              disabled: w.current,
            })),
          },
          {
            key: 'settings',
            label: t('Settings'),
            onClick: () => {
              navigate('/settings');
            },
          },
          {
            key: 'logout',
            label: t('Logout'),
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
    <div className="flex h-full flex-col dark:bg-gray-900 dark:text-gray-300">
      {showHeader && (
        <div className="sticky top-0 z-20 flex h-[62px] items-center bg-gray-100 px-4 dark:bg-gray-800">
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
                <div className="flex h-full flex-col pt-12">
                  <div className="flex-1">
                    <MobileNavItem
                      to="/dashboard"
                      label={t('Dashboard')}
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/monitor"
                      label={t('Monitor')}
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/website"
                      label={t('Website')}
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/servers"
                      label={t('Servers')}
                      onClick={() => setOpenDraw(false)}
                    />
                    <MobileNavItem
                      to="/telemetry"
                      label={t('Telemetry')}
                      onClick={() => setOpenDraw(false)}
                    />

                    <MobileNavItem
                      to="/settings"
                      label={t('Settings')}
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

          <div className="mr-10 flex items-center px-2 font-bold">
            <img src="/icon.svg" className="mr-2 h-10 w-10" />
            <span className="text-xl dark:text-gray-200">Tianji</span>
          </div>

          {!isMobile && (
            <>
              <div className="flex gap-8">
                <NavItem to="/dashboard" label={t('Dashboard')} />
                <NavItem to="/monitor" label={t('Monitor')} />
                <NavItem to="/website" label={t('Website')} />
                <NavItem to="/servers" label={t('Servers')} />
                <NavItem to="/telemetry" label={t('Telemetry')} />
                <NavItem to="/settings" label={t('Settings')} />
              </div>

              <div className="flex-1" />

              <div className="flex gap-2">
                <LanguageSelector />

                <ColorSchemeSwitcher />

                {accountEl}
              </div>
            </>
          )}
        </div>
      )}
      <div className="w-full flex-1 overflow-hidden">
        <div className="h-full overflow-auto px-1 sm:px-4">
          <div className="m-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
});
Layout.displayName = 'Layout';
