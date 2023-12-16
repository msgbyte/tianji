import { Button, Empty } from 'antd';
import React from 'react';
import { trpc } from '../../../api/trpc';
import { MonitorHealthBar } from '../MonitorHealthBar';
import { useAllowEdit } from './useAllowEdit';

interface MonitorStatusPageProps {
  slug: string;
}

export const MonitorStatusPage: React.FC<MonitorStatusPageProps> = React.memo(
  (props) => {
    const { slug } = props;

    const { data: info } = trpc.monitor.getPageInfo.useQuery({
      slug,
    });

    const allowEdit = useAllowEdit(info?.workspaceId);

    const monitorList = info?.monitorList ?? [];

    return (
      <div className="w-4/5 mx-auto py-8 ">
        <div className="text-2xl mb-4">{info?.title}</div>

        <div>{allowEdit && <Button type="primary">Edit</Button>}</div>

        <div className="text-lg mb-2">Services</div>

        {info && (
          <div className="shadow-2xl p-2.5">
            {monitorList.length > 0 ? (
              monitorList.map((item) => (
                <div
                  key={item.id}
                  className="hover:bg-black hover:bg-opacity-20"
                >
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
  }
);
MonitorStatusPage.displayName = 'MonitorStatusPage';
