import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorInfo } from '@/components/monitor/MonitorInfo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { pick } from 'lodash-es';
import { LuCodeXml, LuCopy, LuEllipsisVertical } from 'react-icons/lu';
import { Modal } from 'antd';
import { useState } from 'react';

export const Route = createFileRoute('/monitor/$monitorId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: MonitorDetailComponent,
});

function MonitorDetailComponent() {
  const { monitorId } = Route.useParams<{ monitorId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: monitor, isLoading } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const [showPushUsage, setShowPushUsage] = useState(false);

  if (!monitorId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!monitor) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={monitor.name}
          actions={
            <div className="flex items-center gap-2">
              {monitor.type === 'push' && (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setShowPushUsage(true)}
                >
                  <LuCodeXml />
                </Button>
              )}

              {hasAdminPermission && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild={true}
                    className="cursor-pointer"
                  >
                    <Button variant="outline" size="icon" className="shrink-0">
                      <LuEllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate({
                          to: '/monitor/add',
                          search: pick(monitor, [
                            'name',
                            'type',
                            'notifications',
                            'interval',
                            'maxRetries',
                            'trendingMode',
                            'payload',
                          ]),
                        })
                      }
                    >
                      <LuCopy className="mr-2" />
                      {t('Duplicate')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <MonitorInfo monitorId={monitor.id} />
      </ScrollArea>

      {/* Push使用说明模态框 */}
      {monitor.type === 'push' && (
        <Modal
          title={t('Push Monitoring Usage')}
          open={showPushUsage}
          onCancel={() => setShowPushUsage(false)}
          onOk={() => setShowPushUsage(false)}
          destroyOnClose={true}
          centered={true}
        >
          <div className="mt-4 text-sm">
            <p>
              {t(
                '1. Send HTTP requests to the following URL regularly to indicate service health:'
              )}
            </p>
            <code className="mt-1 block rounded bg-gray-100 p-2 dark:bg-gray-800">
              {`${window.location.origin}/api/push/${monitor.payload.pushToken}?status=up&msg=ok&value=`}
            </code>
            <p className="mt-2">{t('2. Push abnormal status:')}</p>
            <code className="mt-1 block rounded bg-gray-100 p-2 dark:bg-gray-800">
              {`${window.location.origin}/api/push/${monitor.payload.pushToken}?status=down`}
            </code>
            <p className="mt-2">
              {t(
                '3. If no push is received within {{timeout}} seconds, an alarm will be triggered',
                {
                  timeout: monitor.payload.timeout || 60,
                }
              )}
            </p>
          </div>
        </Modal>
      )}
    </CommonWrapper>
  );
}
