import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { t } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { Modal } from 'antd';

export function useMonitorAction(workspaceId: string, monitorId: string) {
  const navigate = useNavigate();
  const changeActiveMutation = trpc.monitor.changeActive.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.monitor.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const clearEventsMutation = trpc.monitor.clearEvents.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const clearDataMutation = trpc.monitor.clearData.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const testNotifyScriptMutation = trpc.monitor.testNotifyScript.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const triggerMonitorMutation = trpc.monitor.triggerMonitor.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();

  const handleStart = useEvent(async () => {
    await changeActiveMutation.mutateAsync({
      workspaceId,
      monitorId,
      active: true,
    });

    trpcUtils.monitor.all.refetch({
      workspaceId,
    });
    trpcUtils.monitor.get.refetch({
      workspaceId,
      monitorId,
    });
    trpcUtils.monitor.events.refetch({
      workspaceId,
      monitorId,
    });
  });

  const handleStop = useEvent(async () => {
    await changeActiveMutation.mutateAsync({
      workspaceId,
      monitorId,
      active: false,
    });

    trpcUtils.monitor.all.refetch({
      workspaceId,
    });
    trpcUtils.monitor.get.refetch({
      workspaceId,
      monitorId,
    });
    trpcUtils.monitor.events.refetch({
      workspaceId,
      monitorId,
    });
  });

  const handleDelete = useEvent(async () => {
    Modal.confirm({
      title: t('Warning'),
      content: t('Did you sure delete this monitor?'),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await deleteMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        await trpcUtils.monitor.all.refetch();

        navigate({
          to: '/monitor',
          replace: true,
        });
      },
    });
  });

  const handleClearEvents = useEvent(() => {
    Modal.confirm({
      title: t('Warning'),
      content: t('Are you sure want to delete all events for this monitor?'),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await clearEventsMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        trpcUtils.monitor.events.refetch({
          workspaceId,
          monitorId,
        });
      },
    });
  });

  const handleClearData = useEvent(() => {
    Modal.confirm({
      title: t('Warning'),
      content: t(
        'Are you sure want to delete all heartbeats for this monitor?'
      ),
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        await clearDataMutation.mutateAsync({
          workspaceId,
          monitorId,
        });
        trpcUtils.monitor.data.reset();
        trpcUtils.monitor.recentData.reset();
      },
    });
  });

  const handleTriggerMonitor = useEvent(async () => {
    await triggerMonitorMutation.mutateAsync({
      workspaceId,
      monitorId,
    });

    // Refresh monitor data and status
    trpcUtils.monitor.get.refetch({
      workspaceId,
      monitorId,
    });
    trpcUtils.monitor.getStatus.refetch({
      workspaceId,
      monitorId,
      statusName: 'lastPush',
    });
  });

  return {
    changeActiveMutation,
    deleteMutation,
    clearEventsMutation,
    clearDataMutation,
    testNotifyScriptMutation,
    triggerMonitorMutation,
    handleStart,
    handleStop,
    handleDelete,
    handleClearEvents,
    handleClearData,
    handleTriggerMonitor,
  };
}
