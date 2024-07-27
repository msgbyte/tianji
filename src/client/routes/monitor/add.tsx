import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import {
  MonitorInfoEditor,
  MonitorInfoEditorValues,
} from '@/components/monitor/MonitorInfoEditor';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useMonitorUpsert } from '@/api/model/monitor';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import { isEmpty } from 'lodash-es';

export const Route = createFileRoute('/monitor/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: MonitorAddComponent,
});

function MonitorAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = useMonitorUpsert();
  const search = Route.useSearch();
  const initialValues = useMemo(
    () => (isEmpty(search) ? undefined : (search as MonitorInfoEditorValues)),
    []
  );

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
            <MonitorInfoEditor
              initialValues={initialValues}
              onSave={handleSubmit}
            />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
