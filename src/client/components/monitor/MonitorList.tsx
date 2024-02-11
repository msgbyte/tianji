import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { Loading } from '../Loading';
import { Empty } from 'antd';
import { MonitorListItem } from './MonitorListItem';
import { useNavigate, useParams } from 'react-router';
import clsx from 'clsx';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorList: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: monitors = [], isLoading } = trpc.monitor.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();
  const params = useParams<{
    '*': string;
  }>()['*'];

  const selectedMonitorId = useMemo(() => {
    return params?.split('/')[0] ?? '';
  }, [params]);

  if (!workspaceId) {
    return <NoWorkspaceTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-2">
      {monitors.length === 0 && (
        <Empty description={t('Here is no monitor yet.')} />
      )}

      {monitors.map((monitor) => (
        <MonitorListItem
          key={monitor.id}
          className={clsx(
            selectedMonitorId === monitor.id && '!bg-opacity-20',
            monitor.active === false && 'opacity-40'
          )}
          workspaceId={workspaceId}
          monitorId={monitor.id}
          monitorName={monitor.name}
          monitorType={monitor.type}
          onClick={() => {
            navigate(`/monitor/${monitor.id}`);
          }}
        />
      ))}
    </div>
  );
});
MonitorList.displayName = 'MonitorList';
