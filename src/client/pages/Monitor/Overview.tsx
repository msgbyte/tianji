import React from 'react';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { Card } from 'antd';
import { MonitorEventList } from '../../components/monitor/MonitorEventList';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorOverview: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const { data: monitors = [] } = trpc.monitor.all.useQuery({
    workspaceId: currentWorkspaceId,
  });

  return (
    <div className="px-2">
      <div className="grid grid-cols-2 gap-4">
        <Card hoverable={true}>
          <div>{t('Monitors')}</div>
          <div className="text-2xl font-semibold">{monitors.length}</div>
        </Card>
        <Card hoverable={true}>
          <div>{t('Available')}</div>
          <div className="text-2xl font-semibold">
            {monitors.filter((m) => m.active).length}
          </div>
        </Card>
      </div>
      <div className="py-2">
        <MonitorEventList />
      </div>
    </div>
  );
});
MonitorOverview.displayName = 'MonitorOverview';
