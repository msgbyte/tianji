import clsx from 'clsx';
import React from 'react';
import { RouterOutput, trpc } from '../api/trpc';
import { HealthBar } from '../components/HealthBar';
import { useEvent } from '../hooks/useEvent';
import { useCurrentWorkspaceId } from '../store/user';

interface MonitorHeartbeatInfo {
  name: string;
  dayOnlineRate: number;
  monthOnlineRate: number;
  certificateExpiredTo: string;
  detectFrequency: number; // second
  response: number;
  avgResponse: number; // 24hour
  tags: { label: string; color: string }[];
}

const demoMonitors = [
  {
    name: 'Tianji',
    dayOnlineRate: 1,
    monthOnlineRate: 0.8,
    certificateExpiredTo: '2023-9-2 15:49:56',
    detectFrequency: 300,
    response: 592,
    avgResponse: 846,
    tags: [{ label: 'Core', color: 'red' }],
  },
];

export const Monitor: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const { data: monitors = [] } = trpc.monitor.all.useQuery({
    workspaceId: currentWorkspaceId,
  });

  const handleCreateMonitor = useEvent(() => {
    // TODO
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="p-4">
          <div
            className="px-3 py-2 rounded-full bg-green-400 hover:bg-green-500 text-white inline-block cursor-pointer"
            onClick={handleCreateMonitor}
          >
            Add new Montior
          </div>
        </div>
      </div>
      <div className="py-5 flex h-full">
        <div className="w-5/12 bg-gray-50">
          <MonitorList monitors={monitors} />
        </div>
        <div className="w-7/12">Info</div>
      </div>
    </div>
  );
});
Monitor.displayName = 'Monitor';

const MonitorList: React.FC<{
  monitors: RouterOutput['monitor']['all'];
}> = React.memo((props) => {
  const selectedMonitorName = 'Tianji1';

  return (
    <div>
      {props.monitors.map((monitor) => (
        <div
          key={monitor.name}
          className={clsx('flex rounded-lg py-3 px-4 cursor-pointer', {
            'bg-green-500 bg-opacity-20': selectedMonitorName === monitor.name,
            'bg-green-500 bg-opacity-0 hover:bg-opacity-10':
              selectedMonitorName !== monitor.name,
          })}
        >
          <div>
            <span
              className={
                'bg-green-400 min-w-[62px] p-0.5 rounded-full text-white inline-block text-center'
              }
            >
              {/* {monitor.monthOnlineRate * 100}% */}
              80%
            </span>
          </div>
          <div className="flex-1 pl-2">
            <div className="text-base mb-2">{monitor.name}</div>
            {/* <div>
              {monitor.tags.map((tag) => (
                <span
                  className="py-0.5 px-1 rounded-full text-white text-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.label}
                </span>
              ))}
            </div> */}
          </div>

          <div className="flex items-center">
            <HealthBar
              beats={Array.from({ length: 13 }).map(() => ({
                status: 'health',
              }))}
            />
          </div>
        </div>
      ))}
    </div>
  );
});
MonitorList.displayName = 'MonitorList';
