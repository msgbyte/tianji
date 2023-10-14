import { useQueryClient } from '@tanstack/react-query';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  getQueryKey,
  trpc,
} from '../trpc';

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
