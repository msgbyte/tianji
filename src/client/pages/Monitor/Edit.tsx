import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { MonitorInfoEditor } from '../../components/modals/monitor/MonitorInfoEditor';
import { useCurrentWorkspaceId } from '../../store/user';

export const MonitorEdit: React.FC = React.memo(() => {
  const { monitorId } = useParams<{ monitorId: string }>();
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { data: monitor, isLoading } = trpc.monitor.get.useQuery({
    id: monitorId!,
    workspaceId: currentWorkspaceId!,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!monitor) {
    return <ErrorTip />;
  }

  return (
    <div>
      <MonitorInfoEditor
        initialValues={monitor}
        onSave={(value) => {
          console.log(value);
        }}
      />
    </div>
  );
});
MonitorEdit.displayName = 'MonitorEdit';
