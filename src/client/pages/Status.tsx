import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../api/trpc';
import { Empty } from 'antd';
import { MonitorHealthBar } from '../components/monitor/MonitorHealthBar';
import { useUserStore } from '../store/user';

export const StatusPage: React.FC = React.memo(() => {
  const { slug } = useParams<{ slug: string }>();
  useUserStore();

  const { data: info } = trpc.monitor.getPageInfo.useQuery({
    slug: slug!,
  });

  const monitorList = info?.monitorList ?? [];

  return (
    <div className="w-4/5 mx-auto py-8">
      <div className="text-2xl mb-4">{info?.title}</div>

      <div className="text-lg mb-2">Services</div>

      {info && (
        <div className="shadow-2xl p-2.5">
          {monitorList.length > 0 ? (
            monitorList.map((item) => (
              <div key={item.id} className="hover:bg-black hover:bg-opacity-20">
                <MonitorHealthBar
                  workspaceId={info.workspaceId}
                  monitorId={item.id}
                  count={40}
                  size="large"
                  showCurrentStatus={true}
                />
              </div>
            ))
          ) : (
            <Empty description="No any monitor has been set" />
          )}
        </div>
      )}
    </div>
  );
});
StatusPage.displayName = 'StatusPage';
