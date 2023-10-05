import React from 'react';
import { MonitorInfoEditor } from '../../components/modals/monitor/MonitorInfoEditor';
import { useCurrentWorkspaceId } from '../../store/user';

export const MonitorAdd: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId();

  return (
    <div>
      <MonitorInfoEditor
        onSave={(value) => {
          // console.log(value);
        }}
      />
    </div>
  );
});
MonitorAdd.displayName = 'MonitorAdd';
