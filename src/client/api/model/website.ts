import { queryClient } from '../cache';
import { request } from '../request';
import { AppRouterOutput } from '../trpc';

export type WebsiteInfo = NonNullable<AppRouterOutput['website']['info']>;

export function refreshWorkspaceWebsites(workspaceId: string) {
  queryClient.refetchQueries({
    queryKey: ['websites', workspaceId],
  });
}
