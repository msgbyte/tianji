import { Empty } from 'antd';
import React, { useMemo } from 'react';
import { trpc } from '../../../api/trpc';
import { Loading } from '../../Loading';
import { MonitorListItem } from '../MonitorListItem';
import { keyBy } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';

interface StatusPageServicesProps {
  workspaceId: string;
  monitorList: {
    id: string;
    showCurrent?: boolean;
  }[];
}
export const StatusPageServices: React.FC<StatusPageServicesProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { workspaceId, monitorList } = props;

    const { data: list = [], isLoading } = trpc.monitor.getPublicInfo.useQuery({
      monitorIds: monitorList.map((item) => item.id),
    });

    const monitorProps = useMemo(() => keyBy(monitorList, 'id'), [monitorList]);

    if (isLoading) {
      return <Loading />;
    }

    return (
      <div className="flex flex-col gap-4 rounded-md border border-gray-200 p-2.5 dark:border-gray-700">
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
          <Empty description={t('No any monitor has been set')} />
        )}
      </div>
    );
  }
);
StatusPageServices.displayName = 'StatusPageServices';
