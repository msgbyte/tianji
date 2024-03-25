import { defaultErrorHandler, defaultSuccessHandler, trpc } from '../trpc';

export function useMonitorUpsert() {
  const utils = trpc.useUtils();
  const mutation = trpc.monitor.upsert.useMutation({
    onSuccess: (data) => {
      utils.monitor.all.refetch({
        workspaceId: data.workspaceId,
      });

      defaultSuccessHandler();
    },
    onError: defaultErrorHandler,
  });

  return mutation;
}
