import { Button, Card, Dropdown, Space, Spin, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId, useHasAdminPermission } from '../../store/user';
import { Loading } from '../Loading';
import { getMonitorLink } from './provider';
import { NotFoundTip } from '../NotFoundTip';
import { MonitorInfo as MonitorInfoType } from '../../../types';
import { MonitorHealthBar } from './MonitorHealthBar';
import { last } from 'lodash-es';
import { ColorTag } from '../ColorTag';
import { MonitorEventList } from './MonitorEventList';
import { MonitorDataMetrics } from './MonitorDataMetrics';
import { MonitorDataChart } from './MonitorDataChart';
import { DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { MonitorBadgeView } from './MonitorBadgeView';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LuAlertTriangle } from 'react-icons/lu';
import { useMonitorAction } from './useMonitorAction';

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
  const isMobile = useIsMobile();
  const hasAdminPermission = useHasAdminPermission();
  const isMonitorDown = currectResponse === -1;

  const {
    data: monitorInfo,
    isInitialLoading,
    isLoading,
  } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });

  const {
    changeActiveMutation,
    testNotifyScriptMutation,
    handleStart,
    handleStop,
    handleDelete,
    handleClearEvents,
    handleClearData,
  } = useMonitorAction(workspaceId, monitorId);

  if (isInitialLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <div className="h-full w-full overflow-auto">
      <Spin spinning={isLoading}>
        <Space className="w-full" direction="vertical">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between">
            <Space direction="vertical">
              <div>
                <ColorTag label={monitorInfo.type} />
                <span>
                  {getMonitorLink(monitorInfo as any as MonitorInfoType)}
                </span>
              </div>

              {hasAdminPermission && (
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    onClick={() => {
                      navigate({
                        to: '/monitor/$monitorId/edit',
                        params: {
                          monitorId: monitorInfo.id,
                        },
                      });
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
                          key: 'testNotify',
                          label: t('Test Notify'),
                          onClick: () =>
                            testNotifyScriptMutation.mutateAsync({
                              workspaceId,
                              monitorId,
                            }),
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
              )}
            </Space>

            <div className="text-right text-black text-opacity-75 dark:text-gray-200">
              <div>
                {t('Monitored for {{dayNum}} days', {
                  dayNum: dayjs().diff(dayjs(monitorInfo.createdAt), 'days'),
                })}
              </div>
              {monitorInfo.active === false && (
                <div className="inline-block rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {t('Stopped')}
                </div>
              )}
            </div>
          </div>

          <Card>
            <MonitorHealthBar
              workspaceId={workspaceId}
              monitorId={monitorId}
              monitorType={monitorInfo.type}
              count={isMobile ? 30 : 40}
              size={isMobile ? 'small' : 'large'}
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

          {isMonitorDown && monitorInfo.recentError && (
            <Alert variant="destructive">
              <LuAlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('Monitor Detect Error')}</AlertTitle>
              <AlertDescription>{monitorInfo.recentError}</AlertDescription>
            </Alert>
          )}

          {hasAdminPermission && (
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
          )}

          <MonitorEventList monitorId={monitorId} />
        </Space>
      </Spin>
    </div>
  );
});
MonitorInfo.displayName = 'MonitorInfo';
