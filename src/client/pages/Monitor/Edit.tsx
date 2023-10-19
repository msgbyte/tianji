import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMonitorUpsert } from '../../api/model/monitor';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import {
  MonitorInfoEditor,
  MonitorInfoEditorValues,
} from '../../components/modals/monitor/MonitorInfoEditor';
import { useCurrentWorkspaceId } from '../../store/user';

export const MonitorEdit: React.FC = React.memo(() => {
  const { monitorId } = useParams<{ monitorId: string }>();
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { data: monitor, isLoading } = trpc.monitor.get.useQuery({
    id: monitorId!,
    workspaceId: currentWorkspaceId,
  });
  const mutation = useMonitorUpsert();
  const navigate = useNavigate();

  if (isLoading) {
    return <Loading />;
  }

  if (!monitor) {
    return <ErrorTip />;
  }

  return (
    <div>
      <MonitorInfoEditor
        initialValues={monitor as MonitorInfoEditorValues}
        onSave={async (value) => {
          const monitor = await mutation.mutateAsync({
            ...value,
            workspaceId: currentWorkspaceId,
          });
          navigate(`/monitor/${monitor.id}`, { replace: true });
        }}
      />
    </div>
  );
});
MonitorEdit.displayName = 'MonitorEdit';
