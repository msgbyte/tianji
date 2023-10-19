import { defaultErrorHandler, defaultSuccessHandler, trpc } from '../trpc';

export function useMonitorUpsert() {
  const context = trpc.useContext();
  const mutation = trpc.monitor.upsert.useMutation({
    onSuccess: (data) => {
      context.monitor.all.reset({
        workspaceId: data.workspaceId,
      });

      defaultSuccessHandler();
    },
    onError: defaultErrorHandler,
  });

  return mutation;
}
