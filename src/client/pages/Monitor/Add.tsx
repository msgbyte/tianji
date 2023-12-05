import React from 'react';
import { useNavigate } from 'react-router';
import { useMonitorUpsert } from '../../api/model/monitor';
import { MonitorInfoEditor } from '../../components/monitor/MonitorInfoEditor';
import { useCurrentWorkspaceId } from '../../store/user';

export const MonitorAdd: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const mutation = useMonitorUpsert();
  const navigate = useNavigate();

  return (
    <div>
      <MonitorInfoEditor
        onSave={async (value) => {
          await mutation.mutateAsync({
            ...value,
            workspaceId: currentWorkspaceId,
          });
          navigate('/monitor', { replace: true });
        }}
      />
    </div>
  );
});
MonitorAdd.displayName = 'MonitorAdd';
