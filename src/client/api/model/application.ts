import { queryClient } from '../cache';
import { request } from '../request';
import { AppRouterOutput } from '../trpc';

export type ApplicationInfo = NonNullable<
  AppRouterOutput['application']['info']
>;

export function refreshWorkspaceApplications(workspaceId: string) {
  queryClient.refetchQueries({
    queryKey: ['applications', workspaceId],
  });
}
