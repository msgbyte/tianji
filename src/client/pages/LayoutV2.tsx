import * as React from 'react';
import {
  LuAreaChart,
  LuFilePieChart,
  LuMonitorDot,
  LuServer,
  LuWifi,
} from 'react-icons/lu';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useLocalStorageState } from 'ahooks';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import { Nav } from './Layout/Nav';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { UserConfig } from './Layout/UserConfig';
import { Outlet } from '@tanstack/react-router';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';

const defaultLayout: [number, number, number] = [265, 440, 655];

interface LayoutProps extends React.PropsWithChildren {
  list?: React.ReactNode;
}
export const LayoutV2: React.FC<LayoutProps> = React.memo((props) => {
  const [layout = defaultLayout, setLayout] = useLocalStorageState(
    'react-resizable-panels:layout',
    { defaultValue: defaultLayout }
  );
  const [isCollapsed = false, setIsCollapsed] = useLocalStorageState<boolean>(
    'react-resizable-panels:collapsed',
    {
      defaultValue: false,
    }
  );
  const workspaceId = useCurrentWorkspaceId();
  const { data: serviceCount } = trpc.workspace.getServiceCount.useQuery({
    workspaceId,
  });

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          if (sizes.length === 3) {
            setLayout(sizes as typeof defaultLayout);
          } else if (sizes.length === 2) {
            const listSize = layout[1];
            const rest = 100 - sizes[0] - listSize;
            setLayout([sizes[0], listSize, rest]);
          }
        }}
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={layout[0]}
          collapsedSize={4}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true);
          }}
          onExpand={() => {
            setIsCollapsed(false);
          }}
          className={cn(
            'flex flex-col',
            isCollapsed &&
              'min-w-[50px] transition-all duration-300 ease-in-out'
          )}
        >
          <div
            className={cn(
              'flex h-[52px] items-center justify-center',
              isCollapsed ? 'h-[52px]' : 'px-2'
            )}
          >
            <WorkspaceSwitcher isCollapsed={isCollapsed} />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: 'Website',
                label: String(serviceCount?.website ?? ''),
                icon: LuAreaChart,
                to: '/website',
              },
              {
                title: 'Monitor',
                label: String(serviceCount?.monitor ?? ''),
                icon: LuMonitorDot,
                to: '/monitor',
              },
              {
                title: 'Servers',
                label: '',
                icon: LuServer,
                to: '/server',
              },
              {
                title: 'Telemetry',
                label: String(serviceCount?.telemetry ?? ''),
                icon: LuWifi,
                to: '/telemetry',
              },
              {
                title: 'Pages',
                label: String(serviceCount?.page ?? ''),
                icon: LuFilePieChart,
                to: '/page',
              },
            ]}
          />
          <Separator />
          <div className="flex-1" />
          <Separator />

          <UserConfig isCollapsed={isCollapsed} />
        </ResizablePanel>

        {props.list && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={layout[1]} minSize={25}>
              <div className="h-full overflow-hidden">{props.list}</div>
            </ResizablePanel>
          </>
        )}

        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={props.list ? layout[2] : layout[1] + layout[2]}
        >
          <div className="h-full overflow-hidden">
            {props.children ?? <Outlet />}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
});
LayoutV2.displayName = 'LayoutV2';
