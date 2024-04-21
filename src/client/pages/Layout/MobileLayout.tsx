import React from 'react';
import {
  LuAreaChart,
  LuFilePieChart,
  LuMenu,
  LuMonitorDot,
  LuServer,
  LuWifi,
} from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { IconType } from 'react-icons';
import { useRouterState, Link, Outlet } from '@tanstack/react-router';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import { LayoutProps } from './types';
import { UserConfig } from './UserConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export const MobileLayout: React.FC<LayoutProps> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-svh flex-col">
      <div className="flex h-[52px] items-center justify-between px-2">
        <Sheet>
          <SheetTrigger disabled={!Boolean(props.list)}>
            <Button
              variant="outline"
              size="icon"
              disabled={!Boolean(props.list)}
            >
              <LuMenu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-11/12">
            <ScrollArea className="h-full">{props.list}</ScrollArea>
          </SheetContent>
        </Sheet>

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
          <MobileNavItem title={t('Telemetry')} icon={LuWifi} to="/telemetry" />
          <MobileNavItem title={t('Pages')} icon={LuFilePieChart} to="/page" />
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
}> = React.memo((props) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isSelect = pathname.startsWith(props.to);

  return (
    <Link
      className={cn(
        'flex-1 rounded-lg p-1 text-center',
        isSelect
          ? 'bg-muted text-black dark:text-white'
          : 'text-muted-foreground'
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
