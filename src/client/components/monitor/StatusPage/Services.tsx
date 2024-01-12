import { Empty } from 'antd';
import React, { useMemo } from 'react';
import { trpc } from '../../../api/trpc';
import { Loading } from '../../Loading';
import { MonitorListItem } from '../MonitorListItem';
import { keyBy } from 'lodash-es';

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

    const monitorProps = useMemo(() => keyBy(monitorList, 'id'), [monitorList]);

    if (isLoading) {
      return <Loading />;
    }

    return (
      <div className="p-2.5 flex flex-col gap-4 rounded-md border border-gray-200 dark:border-gray-700">
        {list.length > 0 ? (
          list.map((item) => (
            <MonitorListItem
              key={item.id}
              workspaceId={workspaceId}
              monitorId={item.id}
              monitorName={item.name}
              monitorType={item.type}
              showCurrentResponse={monitorProps[item.id].showCurrent ?? false}
            />
          ))
        ) : (
          <Empty description="No any monitor has been set" />
        )}
      </div>
    );
  }
);
StatusPageServices.displayName = 'StatusPageServices';
