import { Empty } from 'antd';
import React from 'react';
import { trpc } from '../../../api/trpc';
import { Loading } from '../../Loading';
import { MonitorListItem } from '../MonitorListItem';

interface StatusPageServicesProps {
  workspaceId: string;
  monitorList: PrismaJson.MonitorStatusPageList;
}
export const StatusPageServices: React.FC<StatusPageServicesProps> = React.memo(
  (props) => {
    const { workspaceId, monitorList } = props;

    const { data: list = [], isLoading } = trpc.monitor.getPublicInfo.useQuery({
      monitorIds: monitorList.map((item) => item.id),
    });

    if (isLoading) {
      return <Loading />;
    }

    return (
      <div className="shadow-2xl p-2.5 flex flex-col gap-4">
        {list.length > 0 ? (
          list.map((item) => (
            <div key={item.id} className="hover:bg-black hover:bg-opacity-20">
              <MonitorListItem
                workspaceId={workspaceId}
                monitorId={item.id}
                monitorName={item.name}
              />
            </div>
          ))
        ) : (
          <Empty description="No any monitor has been set" />
        )}
      </div>
    );
  }
);
StatusPageServices.displayName = 'StatusPageServices';
