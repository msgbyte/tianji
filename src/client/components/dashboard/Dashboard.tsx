import React, { useEffect } from 'react';
import { DashboardGrid } from './Grid';
import { DashboardItemAddButton } from './AddButton';
import { defaultBlankLayouts, useDashboardStore } from '../../store/dashboard';
import { useEvent } from '../../hooks/useEvent';
import { Layouts } from 'react-grid-layout';
import { Button, Empty, message } from 'antd';
import { DateFilter } from '../DateFilter';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspace, useCurrentWorkspaceId } from '../../store/user';

export const Dashboard: React.FC = React.memo(() => {
  const { isEditMode, switchEditMode, layouts, items } = useDashboardStore();
  const mutation = trpc.workspace.saveDashboardLayout.useMutation();
  const workspaceId = useCurrentWorkspaceId();
  const workspace = useCurrentWorkspace();

  useEffect(() => {
    // Init on mount
    const { items = [], layouts = defaultBlankLayouts } =
      workspace.dashboardLayout ?? {};

    useDashboardStore.setState({
      items,
      layouts,
    });
  }, []);

  const handleChangeLayouts = useEvent((layouts: Layouts) => {
    useDashboardStore.setState({
      layouts,
    });
  });

  const handleSaveDashboardLayout = useEvent(async () => {
    await mutation.mutateAsync({
      workspaceId,
      dashboardLayout: {
        layouts,
        items,
      },
    });
    switchEditMode();
    message.success('Layout saved success');
  });

  return (
    <div className="py-4">
      <div className="flex gap-2 justify-end">
        {isEditMode ? (
          <>
            <DashboardItemAddButton />
            <Button
              className="w-32"
              size="large"
              loading={mutation.isLoading}
              disabled={mutation.isLoading}
              onClick={handleSaveDashboardLayout}
            >
              Done
            </Button>
          </>
        ) : (
          <>
            <DateFilter />
            <Button
              className="w-32"
              type="primary"
              size="large"
              onClick={switchEditMode}
            >
              Edit
            </Button>
          </>
        )}
      </div>
      <DashboardGrid
        layouts={layouts}
        onChangeLayouts={handleChangeLayouts}
        items={items}
        isEditMode={isEditMode}
      />

      {items.length === 0 && (
        <Empty description="You have not dashboard item yet, please enter edit mode and add you item." />
      )}
    </div>
  );
});
Dashboard.displayName = 'Dashboard';
