import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '../trpc';

export function useMonitorUpsert() {
  const queryClient = useQueryClient();
  const mutation = trpc.monitor.upsert.useMutation({
    onSuccess: (data) => {
      queryClient.resetQueries(getQueryKey(trpc.monitor.all));

      defaultSuccessHandler();
    },
    onError: defaultErrorHandler,
  });

  return mutation;
}
