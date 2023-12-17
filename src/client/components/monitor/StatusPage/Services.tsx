import { Empty } from 'antd';
import React from 'react';
import { MonitorHealthBar } from '../MonitorHealthBar';

interface StatusPageServicesProps {
  workspaceId: string;
  monitorList: PrismaJson.MonitorStatusPageList;
}
export const StatusPageServices: React.FC<StatusPageServicesProps> = React.memo(
  (props) => {
    const { workspaceId, monitorList } = props;

    return (
      <div className="shadow-2xl p-2.5 flex flex-col gap-4">
        {monitorList.length > 0 ? (
          monitorList.map((item) => (
            <div key={item.id} className="hover:bg-black hover:bg-opacity-20">
              <MonitorHealthBar
                workspaceId={workspaceId}
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
    );
  }
);
StatusPageServices.displayName = 'StatusPageServices';
