import { Button, Card, Popconfirm, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Loading } from '../Loading';
import { getMonitorLink } from './provider';
import { NotFoundTip } from '../NotFoundTip';
import { MonitorInfo as MonitorInfoType } from '../../../types';
import { MonitorHealthBar } from './MonitorHealthBar';
import { last } from 'lodash-es';
import { ColorTag } from '../ColorTag';
import { useNavigate } from 'react-router';
import { MonitorEventList } from './MonitorEventList';
import { useEvent } from '../../hooks/useEvent';
import { MonitorDataMetrics } from './MonitorDataMetrics';
import { MonitorDataChart } from './MonitorDataChart';

interface MonitorInfoProps {
  monitorId: string;
}
export const MonitorInfo: React.FC<MonitorInfoProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId } = props;
  const [currectResponse, setCurrentResponse] = useState(0);
  const navigate = useNavigate();

  const {
    data: monitorInfo,
    isInitialLoading,
    isLoading,
  } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });
  const changeActiveMutation = trpc.monitor.changeActive.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.monitor.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });

  const trpcUtils = trpc.useContext();

  const handleStart = useEvent(async () => {
    await changeActiveMutation.mutateAsync({
      workspaceId,
      monitorId,
      active: true,
    });

    trpcUtils.monitor.get.refetch({
      workspaceId,
      monitorId,
    });
    trpcUtils.monitor.events.refetch({
      workspaceId,
      monitorId,
    });
  });

  const handleStop = useEvent(async () => {
    await changeActiveMutation.mutateAsync({
      workspaceId,
      monitorId,
      active: false,
    });

    trpcUtils.monitor.get.refetch({
      workspaceId,
      monitorId,
    });
    trpcUtils.monitor.events.refetch({
      workspaceId,
      monitorId,
    });
  });

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({
      workspaceId,
      monitorId,
    });

    trpcUtils.monitor.all.refetch();

    navigate('/monitor');
  });

  if (isInitialLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <div className="w-full h-full overflow-auto">
      <Spin spinning={isLoading}>
        <Space className="w-full" direction="vertical">
          <div className="flex justify-between">
            <Space direction="vertical">
              <div className="text-2xl flex items-center gap-2">
                <span>{monitorInfo.name}</span>
                {monitorInfo.active === false && (
                  <div className="bg-red-500 rounded-full px-2 py-0.5 text-white text-xs">
                    Stoped
                  </div>
                )}
              </div>

              <div>
                <ColorTag label={monitorInfo.type} />
                <span>
                  {getMonitorLink(monitorInfo as any as MonitorInfoType)}
                </span>
              </div>
            </Space>

            <div className="text-black text-opacity-75">
              Monitored for {dayjs().diff(dayjs(monitorInfo.createdAt), 'days')}{' '}
              days
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={() => {
                navigate(`/monitor/${monitorInfo.id}/edit`);
              }}
            >
              Edit
            </Button>

            {monitorInfo.active ? (
              <Button
                loading={changeActiveMutation.isLoading}
                onClick={handleStop}
              >
                Stop
              </Button>
            ) : (
              <Button
                loading={changeActiveMutation.isLoading}
                onClick={handleStart}
              >
                Start
              </Button>
            )}

            <Popconfirm
              title="How you sure delete this monitor?"
              onConfirm={handleDelete}
            >
              <Button danger={true}>Delete</Button>
            </Popconfirm>
          </div>

          <Card>
            <MonitorHealthBar
              monitorId={monitorId}
              count={40}
              size="large"
              showCurrentStatus={true}
              onBeatsItemUpdate={(items) => {
                setCurrentResponse(last(items)?.value ?? 0);
              }}
            />
          </Card>

          <Card>
            <MonitorDataMetrics
              monitorId={monitorId}
              monitorType={monitorInfo.type}
              currectResponse={currectResponse}
            />
          </Card>

          <Card>
            <MonitorDataChart monitorId={monitorId} />
          </Card>

          <MonitorEventList monitorId={monitorId} />
        </Space>
      </Spin>
    </div>
  );
});
MonitorInfo.displayName = 'MonitorInfo';
