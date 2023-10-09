import { Card } from 'antd';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { HealthBar } from '../HealthBar';
import { NoWorkspaceTip } from '../NoWorkspaceTip';

export const MonitorList: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const { data: monitors = [] } = trpc.monitor.all.useQuery({
    workspaceId: currentWorkspaceId,
  });
  const navigate = useNavigate();
  const initMonitorId = useMemo(() => {
    const pathname = window.location.pathname;
    const re = /^\/monitor\/([^\/]+?)$/;
    if (re.test(pathname)) {
      const id = pathname.match(re)?.[1];

      if (typeof id === 'string') {
        return id;
      }
    }

    return null;
  }, []);

  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    initMonitorId
  );

  if (!currentWorkspaceId) {
    return <NoWorkspaceTip />;
  }

  return (
    <div>
      {monitors.map((monitor) => (
        <div
          key={monitor.name}
          className={clsx(
            'flex rounded-lg py-3 px-4 cursor-pointer',
            selectedMonitorId === monitor.id
              ? 'bg-green-500 bg-opacity-20'
              : 'bg-green-500 bg-opacity-0 hover:bg-opacity-10'
          )}
          onClick={() => {
            navigate(`/monitor/${monitor.id}`);
            setSelectedMonitorId(monitor.id);
          }}
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
