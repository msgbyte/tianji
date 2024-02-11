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
import clsx from 'clsx';
import { useTranslation } from '@i18next-toolkit/react';

export const Dashboard: React.FC = React.memo(() => {
  const { t } = useTranslation();
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
    message.success(t('Layout saved success'));
  });

  return (
    <div className="py-4">
      <div
        className={clsx(
          'flex gap-2 justify-end bg-white dark:bg-gray-900 py-2',
          isEditMode && 'sticky top-0 z-10'
        )}
      >
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
              {t('Done')}
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
              {t('Edit')}
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
        <Empty
          description={t(
            'You have not dashboard item yet, please enter edit mode and add you item.'
          )}
        />
      )}
    </div>
  );
});
Dashboard.displayName = 'Dashboard';
