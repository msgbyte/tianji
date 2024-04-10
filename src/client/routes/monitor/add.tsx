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
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/monitor/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: MonitorAddComponent,
});

function MonitorAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = useMonitorUpsert();

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
    });
  });

  return (
    <CommonWrapper header={<CommonHeader title={t('Add Monitor')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <MonitorInfoEditor onSave={handleSubmit} />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
