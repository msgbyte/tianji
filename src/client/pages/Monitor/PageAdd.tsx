import React from 'react';
import { useNavigate } from 'react-router';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { useEvent } from '../../hooks/useEvent';
import { MonitorStatusPageEditForm } from '../../components/monitor/StatusPage/EditForm';

interface Values {
  title: string;
  slug: string;
}

export const MonitorPageAdd: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId()!;
  const navigate = useNavigate();

  const createPageMutation = trpc.monitor.createPage.useMutation();
  const trpcUtils = trpc.useContext();

  const handleFinish = useEvent(async (values: Values) => {
    await createPageMutation.mutateAsync({
      workspaceId,
      title: values.title,
      slug: values.slug,
    });

    trpcUtils.monitor.getAllPages.refetch();

    navigate('/monitor/pages');
  });

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
