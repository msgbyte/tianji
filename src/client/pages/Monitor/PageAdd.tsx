import React from 'react';
import { useNavigate } from 'react-router';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { useEvent } from '../../hooks/useEvent';
import {
  MonitorStatusPageEditForm,
  MonitorStatusPageEditFormValues,
} from '../../components/monitor/StatusPage/EditForm';

export const MonitorPageAdd: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId()!;
  const navigate = useNavigate();

  const createPageMutation = trpc.monitor.createPage.useMutation();
  const trpcUtils = trpc.useContext();

  const handleFinish = useEvent(
    async (values: MonitorStatusPageEditFormValues) => {
      await createPageMutation.mutateAsync({
        ...values,
        workspaceId,
      });

      trpcUtils.monitor.getAllPages.refetch();

      navigate('/monitor/pages');
    }
  );

  return (
    <div className="px-8 py-4">
      <MonitorStatusPageEditForm
        saveButtonLabel="Next"
        isLoading={createPageMutation.isLoading}
        onFinish={handleFinish}
      />
    </div>
  );
});
MonitorPageAdd.displayName = 'MonitorPageAdd';
