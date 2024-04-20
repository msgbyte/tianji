import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { t, useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import {
  MonitorInfoEditor,
  MonitorInfoEditorValues,
} from '@/components/monitor/MonitorInfoEditor';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useMonitorUpsert } from '@/api/model/monitor';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/monitor/$monitorId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const { monitorId } = Route.useParams<{ monitorId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = useMonitorUpsert();
  const { data: monitor, isLoading } = trpc.monitor.get.useQuery({
    monitorId,
    workspaceId,
  });

  const handleSubmit = useEvent(async (values: MonitorInfoEditorValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      workspaceId,
    });

    navigate({
      to: '/monitor/$monitorId',
      params: {
        monitorId: res.id,
      },
      replace: true,
    });
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!monitor) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={<CommonHeader title={monitor.name} desc={t('Edit')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <MonitorInfoEditor
              initialValues={
                {
                  ...monitor,
                  notificationIds: monitor.notifications.map((n) => n.id),
                } as MonitorInfoEditorValues
              }
              onSave={handleSubmit}
            />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
