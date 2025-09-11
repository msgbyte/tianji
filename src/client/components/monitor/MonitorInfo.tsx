import { Card, Dropdown, Space, Modal } from 'antd';
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
import { MonitorBadgeView } from './MonitorBadgeView';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LuTriangleAlert, LuEllipsisVertical, LuTrash2 } from 'react-icons/lu';
import { useMonitorAction } from './useMonitorAction';
import { Button } from '../ui/button';
import { MonitorPushStatus } from './MonitorPushStatus';
import { MonitorHTTPTiming } from './MonitorHTTPTiming';
import { LoadingView } from '../LoadingView';

interface MonitorInfoProps {
  monitorId: string;
}
export const MonitorInfo: React.FC<MonitorInfoProps> = React.memo((props) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId } = props;
  const [currentResponse, setCurrentResponse] = useState(0);
  const navigate = useNavigate();
  const [showBadge, setShowBadge] = useState(false);
  const isMobile = useIsMobile();
  const hasAdminPermission = useHasAdminPermission();
  const isMonitorDown = currentResponse === -1;

  const {
    data: monitorInfo,
    isInitialLoading,
    isLoading,
  } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });
  const trpcutils = trpc.useUtils();

  const {
    changeActiveMutation,
    testNotifyScriptMutation,
    handleStart,
    handleStop,
    handleDelete,
    handleClearEvents,
    handleClearData,
    handleTriggerMonitor,
  } = useMonitorAction(workspaceId, monitorId);

  if (isInitialLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <div className="h-full w-full overflow-auto">
      <LoadingView isLoading={isLoading}>
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
                    variant="secondary"
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
                      loading={changeActiveMutation.isPending}
                      onClick={handleStop}
                    >
                      {t('Stop')}
                    </Button>
                  ) : (
                    <Button
                      loading={changeActiveMutation.isPending}
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
                          key: 'trigger',
                          label: t('Trigger Monitor'),
                          onClick: handleTriggerMonitor,
                        },
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
                    <Button
                      variant="secondary"
                      size="icon"
                      Icon={LuEllipsisVertical}
                    />
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
                trpcutils.monitor.getStatus.invalidate({
                  workspaceId,
                  monitorId,
                });
              }}
            />
          </Card>

          <Card>
            <MonitorDataMetrics
              monitorId={monitorId}
              monitorType={monitorInfo.type}
              currentResponse={currentResponse}
            />
          </Card>

          <Card>
            <MonitorDataChart monitorId={monitorId} />
          </Card>

          {monitorInfo.type === 'http' && (
            <MonitorHTTPTiming monitorId={monitorId} />
          )}

          {monitorInfo.type === 'push' && monitorInfo.active && (
            <Card>
              <MonitorPushStatus monitorId={monitorId} />
            </Card>
          )}

          {isMonitorDown && monitorInfo.recentError && (
            <Alert variant="destructive">
              <LuTriangleAlert className="h-4 w-4" />
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
                <Button variant="destructive" Icon={LuTrash2}>
                  {t('Clear Data')}
                </Button>
              </Dropdown>
            </div>
          )}

          <MonitorEventList monitorId={monitorId} />
        </Space>
      </LoadingView>
    </div>
  );
});
MonitorInfo.displayName = 'MonitorInfo';
