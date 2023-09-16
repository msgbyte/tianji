import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../cache';
import { request } from '../request';
import { getUserTimezone } from './user';

export interface WebsiteInfo {
  id: string;
  name: string;
  domain: string | null;
  shareId: string | null;
  resetAt: string | null;
  workspaceId: string;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export async function getWorkspaceWebsites(
  workspaceId: string
): Promise<WebsiteInfo[]> {
  const { data } = await request.get('/api/workspace/websites', {
    params: {
      workspaceId,
    },
  });

  return data.websites;
}

export async function getWorkspaceWebsiteInfo(
  workspaceId: string,
  websiteId: string
): Promise<WebsiteInfo | null> {
  const { data } = await request.get(`/api/workspace/website/${websiteId}`, {
    params: {
      workspaceId,
    },
  });

  return data.website;
}

export async function updateWorkspaceWebsiteInfo(
  workspaceId: string,
  websiteId: string,
  info: { name: string; domain: string }
) {
  await request.post(`/api/workspace/website/${websiteId}`, {
    workspaceId,
    name: info.name,
    domain: info.domain,
  });

  queryClient.resetQueries(['websites', workspaceId]);
}

export async function deleteWorkspaceWebsite(
  workspaceId: string,
  websiteId: string
) {
  await request.delete(`/api/workspace/${workspaceId}/website/${websiteId}`);

  queryClient.resetQueries(['websites', workspaceId]);
}

export function useWorspaceWebsites(workspaceId: string) {
  const { data: websites = [], isLoading } = useQuery(
    ['websites', workspaceId],
    () => {
      return getWorkspaceWebsites(workspaceId);
    }
  );

  return { websites, isLoading };
}

export function useWorkspaceWebsiteInfo(
  workspaceId: string,
  websiteId: string
) {
  const { data: website = null, isLoading } = useQuery(
    ['website', workspaceId, websiteId],
    () => {
      return getWorkspaceWebsiteInfo(workspaceId, websiteId);
    },
    { cacheTime: 0 }
  );

  return { website, isLoading };
}

export function refreshWorkspaceWebsites(workspaceId: string) {
  queryClient.refetchQueries(['websites', workspaceId]);
}

export async function addWorkspaceWebsite(
  workspaceId: string,
  name: string,
  domain: string
) {
  await request.post('/api/workspace/website', {
    workspaceId,
    name,
    domain,
  });
}

export async function getWorkspaceWebsitePageview(
  workspaceId: string,
  websiteId: string,
  filter: Record<string, any>
) {
  const { data } = await request.get(
    `/api/workspace/${workspaceId}/website/${websiteId}/pageviews`,
    {
      params: {
        ...filter,
      },
    }
  );

  return data;
}

export function useWorkspaceWebsitePageview(
  workspaceId: string,
  websiteId: string,
  startAt: number,
  endAt: number
) {
  const { data, isLoading } = useQuery(
    ['websitePageview', { workspaceId, websiteId }],
    () => {
      return getWorkspaceWebsitePageview(workspaceId, websiteId, {
        startAt,
        endAt,
        unit: 'hour',
        timezone: getUserTimezone(),
      });
    }
  );

  return {
    pageviews: data?.pageviews ?? [],
    sessions: data?.sessions ?? [],
    isLoading,
  };
}
