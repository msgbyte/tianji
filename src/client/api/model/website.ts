import { queryClient } from '../cache';
import { request } from '../request';
import { AppRouterOutput } from '../trpc';

export type WebsiteInfo = NonNullable<AppRouterOutput['website']['info']>;

export async function deleteWorkspaceWebsite(
  workspaceId: string,
  websiteId: string
) {
  await request.delete(`/api/workspace/${workspaceId}/website/${websiteId}`);

  queryClient.resetQueries(['websites', workspaceId]);
}

export function refreshWorkspaceWebsites(workspaceId: string) {
  queryClient.refetchQueries(['websites', workspaceId]);
}
