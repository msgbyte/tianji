import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Card, Empty } from 'antd';
import { useNavigate } from 'react-router';

interface MonitorEventListProps {
  monitorId?: string;
}
export const MonitorEventList: React.FC<MonitorEventListProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { data = [], isLoading } = trpc.monitor.events.useQuery({
      workspaceId,
      monitorId: props.monitorId,
    });
    const navigate = useNavigate();

    if (isLoading === false && data.length === 0) {
      return <Empty />;
    }

    return (
      <div className="space-y-4 py-2">
        {data.map((item) => (
          <Card
            key={item.id}
            className="min-h-[60px]"
            hoverable={true}
            onClick={() => {
              navigate(`/monitor/${item.monitorId}`);
            }}
          >
            <div className="flex items-center w-full gap-2">
              <div
                className={clsx(
                  'min-w-[62px] py-1 px-2 rounded-full text-white inline-block text-center',
                  item.type === 'UP'
                    ? 'bg-green-400'
                    : item.type === 'DOWN'
                    ? 'bg-red-500'
                    : 'bg-amber-400'
                )}
              >
                {item.type}
              </div>

              <div className="text-black text-opacity-60">
                {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </div>

              <div>{item.message}</div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
);
MonitorEventList.displayName = 'MonitorEventList';
