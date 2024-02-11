import { Button, Card, Dropdown, Popconfirm, Space, Spin, Modal } from 'antd';
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
import { DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { MonitorBadgeView } from './MonitorBadgeView';
import { useTranslation } from '@i18next-toolkit/react';

interface MonitorInfoProps {
  monitorId: string;
}
export const MonitorInfo: React.FC<MonitorInfoProps> = React.memo((props) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId } = props;
  const [currectResponse, setCurrentResponse] = useState(0);
  const navigate = useNavigate();
  const [showBadge, setShowBadge] = useState(false);

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
  const clearEventsMutation = trpc.monitor.clearEvents.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const clearDataMutation = trpc.monitor.clearData.useMutation({
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
    Modal.confirm({
      title: t('Warning'),
      content: t('Did you sure delete this monitor?'),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await deleteMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        await trpcUtils.monitor.all.refetch();

        navigate('/monitor', {
          replace: true,
        });
      },
    });
  });

  const handleClearEvents = useEvent(() => {
    Modal.confirm({
      title: t('Warning'),
      content: t('Are you sure want to delete all events for this monitor?'),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await clearEventsMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        trpcUtils.monitor.events.refetch({
          workspaceId,
          monitorId,
        });
      },
    });
  });

  const handleClearData = useEvent(() => {
    Modal.confirm({
      title: t('Warning'),
      content: t(
        'Are you sure want to delete all heartbeats for this monitor?'
      ),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await clearDataMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        trpcUtils.monitor.data.reset();
        trpcUtils.monitor.recentData.reset();
      },
    });
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
                    {t('Stopped')}
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

            <div className="text-black dark:text-gray-200 text-opacity-75">
              {t('Monitored for {{dayNum}} days', {
                dayNum: dayjs().diff(dayjs(monitorInfo.createdAt), 'days'),
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={() => {
                navigate(`/monitor/${monitorInfo.id}/edit`);
              }}
            >
              {t('Edit')}
            </Button>

            {monitorInfo.active ? (
              <Button
                loading={changeActiveMutation.isLoading}
                onClick={handleStop}
              >
                {t('Stop')}
              </Button>
            ) : (
              <Button
                loading={changeActiveMutation.isLoading}
                onClick={handleStart}
              >
                {t('Start')}
              </Button>
            )}

            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'badge',
                    label: t('Show Badge'),
                    onClick: () => setShowBadge(true),
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'delete',
                    label: t('Delete'),
                    danger: true,
                    onClick: handleDelete,
                  },
                ],
              }}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>

            <Modal
              open={showBadge}
              onCancel={() => setShowBadge(false)}
              onOk={() => setShowBadge(false)}
              destroyOnClose={true}
              centered={true}
            >
              <MonitorBadgeView
                workspaceId={workspaceId}
                monitorId={monitorId}
                monitorName={monitorInfo.name}
              />
            </Modal>
          </div>

          <Card>
            <MonitorHealthBar
              workspaceId={workspaceId}
              monitorId={monitorId}
              monitorType={monitorInfo.type}
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

          <div className="text-right">
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'events',
                    label: t('Events'),
                    onClick: handleClearEvents,
                  },
                  {
                    key: 'heartbeats',
                    label: t('Heartbeats'),
                    onClick: handleClearData,
                  },
                ],
              }}
            >
              <Button icon={<DeleteOutlined />} danger={true}>
                {t('Clear Data')}
              </Button>
            </Dropdown>
          </div>

          <MonitorEventList monitorId={monitorId} />
        </Space>
      </Spin>
    </div>
  );
});
MonitorInfo.displayName = 'MonitorInfo';
