import React from 'react';
import {
  LuAreaChart,
  LuFilePieChart,
  LuMonitorDot,
  LuMoreVertical,
  LuServer,
  LuTableProperties,
  LuWifi,
} from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { IconType } from 'react-icons';
import { useRouterState, Link, Outlet } from '@tanstack/react-router';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import { LayoutProps } from './types';
import { UserConfig } from './UserConfig';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { MobileLayoutMenu } from './Menu';

export const MobileLayout: React.FC<LayoutProps> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-svh flex-col">
      <div className="flex h-[52px] items-center justify-between px-2">
        <MobileLayoutMenu list={props.list} />

        <div className="rounded-md dark:bg-white/10">
          <img className="m-auto h-8 w-8" src="/icon.svg" />
        </div>

        <div>
          <UserConfig isCollapsed={true} />
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-hidden">
        {props.children ?? <Outlet />}
      </div>

      <Separator />

      <div className="p-2">
        <div className="flex justify-between">
          <MobileNavItem
            title={t('Website')}
            icon={LuAreaChart}
            to="/website"
          />
          <MobileNavItem
            title={t('Monitor')}
            icon={LuMonitorDot}
            to="/monitor"
          />
          <MobileNavItem title={t('Servers')} icon={LuServer} to="/server" />
          <MobileNavItem title={t('Pages')} icon={LuFilePieChart} to="/page" />

          <Drawer>
            <DrawerTrigger asChild>
              <div className="text-muted-foreground flex-1 rounded-lg p-1 text-center">
                <LuMoreVertical size={24} className="m-auto mb-1" />
                <div className={cn('text-sm font-semibold')}>{t('More')}</div>
              </div>
            </DrawerTrigger>
            <DrawerContent>
              <div className="flex flex-row items-center justify-center gap-2 p-3">
                <MobileNavItem
                  title={t('Telemetry')}
                  icon={LuWifi}
                  to="/telemetry"
                  extraModal={true}
                />
                <MobileNavItem
                  title={t('Survey')}
                  icon={LuTableProperties}
                  to="/survey"
                  extraModal={true}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
});
MobileLayout.displayName = 'MobileLayout';

const MobileNavItem: React.FC<{
  title: string;
  icon: IconType;
  to: string;
  extraModal?: boolean;
}> = React.memo((props) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isSelect = pathname.startsWith(props.to);

  return (
    <Link
      className={cn(
        'flex-1 rounded-lg p-1 py-2 text-center',
        isSelect
          ? 'bg-muted text-black dark:text-white'
          : 'text-muted-foreground',
        props.extraModal && 'flex-none p-3'
      )}
      to={props.to}
    >
      <props.icon size={24} className="m-auto mb-1" />
      <div className={cn('text-sm font-semibold', isSelect && 'font-bold')}>
        {props.title}
      </div>
    </Link>
  );
});
MobileNavItem.displayName = 'MobileNavItem';
