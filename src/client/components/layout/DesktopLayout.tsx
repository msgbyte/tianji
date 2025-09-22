import * as React from 'react';
import {
  LuSquareActivity,
  LuChartArea,
  LuCompass,
  LuFileChartPie,
  LuMonitorDot,
  LuServer,
  LuWifi,
  LuTabletSmartphone,
  LuBrainCircuit,
} from 'react-icons/lu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useLocalStorageState } from 'ahooks';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import { Nav } from './Nav';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { UserConfig } from './UserConfig';
import { Outlet } from '@tanstack/react-router';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LayoutProps } from './types';
import { useTranslation } from '@i18next-toolkit/react';
import { CommandPanel } from '@/components/CommandPanel';
import { RiSurveyLine } from 'react-icons/ri';
import { WorkspacePauseTip } from '../workspace/WorkspacePauseTip';
import { FreeTierTip } from '../FreeTierTip';
import { DevContainer } from '../DevContainer';
import { AIPanel } from '../ai/AIPanel';

const defaultLayout: [number, number, number] = [15, 25, 60];

export const DesktopLayout: React.FC<LayoutProps> = React.memo((props) => {
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
  const { data: serviceCount } = trpc.workspace.getServiceCount.useQuery(
    {
      workspaceId: workspaceId!,
    },
    {
      enabled: !!workspaceId,
    }
  );
  const { t } = useTranslation();

  const navbar = (
    <>
      <div
        className={cn(
          'flex h-[52px] items-center justify-center',
          isCollapsed ? 'h-[52px]' : 'px-2'
        )}
      >
        <WorkspaceSwitcher isCollapsed={isCollapsed} />
      </div>
      <Separator />
      <div className="p-2">
        <CommandPanel isCollapsed={isCollapsed} />
      </div>
      <Separator />

      <DevContainer>
        <Nav
          isCollapsed={isCollapsed}
          links={[
            {
              title: t('Insights'),
              icon: LuCompass,
              to: '/insights',
            },
          ]}
        />
        <Separator />
      </DevContainer>

      <Nav
        isCollapsed={isCollapsed}
        links={[
          {
            title: t('Website'),
            label: String(serviceCount?.website ?? ''),
            icon: LuChartArea,
            to: '/website',
          },
          {
            title: t('Application'),
            label: String(serviceCount?.application ?? ''),
            icon: LuTabletSmartphone,
            to: '/application',
          },
          {
            title: t('Monitor'),
            label: String(serviceCount?.monitor ?? ''),
            icon: LuMonitorDot,
            to: '/monitor',
          },
          {
            title: t('Servers'),
            label: String(serviceCount?.server ?? ''),
            icon: LuServer,
            to: '/server',
          },
          {
            title: t('Telemetry'),
            label: String(serviceCount?.telemetry ?? ''),
            icon: LuWifi,
            to: '/telemetry',
          },
          {
            title: t('Pages'),
            label: String(serviceCount?.page ?? ''),
            icon: LuFileChartPie,
            to: '/page',
          },
          {
            title: t('Survey'),
            label: String(serviceCount?.survey ?? ''),
            icon: RiSurveyLine,
            to: '/survey',
          },
          {
            title: t('Feed'),
            label: String(serviceCount?.feed ?? ''),
            icon: LuSquareActivity,
            to: '/feed',
          },
          {
            title: t('AI Gateway'),
            label: String(serviceCount?.aiGateway ?? ''),
            icon: LuBrainCircuit,
            to: '/aiGateway',
          },
        ]}
      />

      <Separator />

      <div className="flex-1" />

      <div className="p-2">
        <FreeTierTip />
      </div>

      <Separator />

      <div className={cn(isCollapsed && 'm-auto')}>
        <UserConfig isCollapsed={isCollapsed} />
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <WorkspacePauseTip />
      <AIPanel />

      <ResizablePanelGroup
        className="flex-1 items-stretch"
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
      >
        <ResizablePanel
          defaultSize={layout[0]}
          collapsedSize={1}
          collapsible={true}
          minSize={10}
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
          {navbar}
        </ResizablePanel>

        {props.list && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={layout[1]} minSize={20}>
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
    </div>
  );
});
DesktopLayout.displayName = 'DesktopLayout';
