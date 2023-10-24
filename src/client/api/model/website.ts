import { useQuery } from '@tanstack/react-query';
import { DateUnit } from '../../utils/date';
import { queryClient } from '../cache';
import { request } from '../request';
import { getUserTimezone } from './user';
import { AppRouterOutput } from '../trpc';

export type WebsiteInfo = NonNullable<AppRouterOutput['website']['info']>;

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
  endAt: number,
  unit: DateUnit
) {
  const { data, isLoading, refetch } = useQuery(
    ['websitePageview', { workspaceId, websiteId, startAt, endAt }],
    () => {
      return getWorkspaceWebsitePageview(workspaceId, websiteId, {
        startAt,
        endAt,
        unit,
        timezone: getUserTimezone(),
      });
    }
  );

  return {
    pageviews: data?.pageviews ?? [],
    sessions: data?.sessions ?? [],
    isLoading,
    refetch,
  };
}

export interface StatsItemType {
  value: number;
  change: number;
}
export async function getWorkspaceWebsiteStats(
  workspaceId: string,
  websiteId: string,
  filter: Record<string, any>
): Promise<{
  bounces: StatsItemType;
  pageviews: StatsItemType;
  totaltime: StatsItemType;
  uniques: StatsItemType;
}> {
  const { data } = await request.get(
    `/api/workspace/${workspaceId}/website/${websiteId}/stats`,
    {
      params: {
        ...filter,
      },
    }
  );

  return data.stats;
}

export function useWorkspaceWebsiteStats(
  workspaceId: string,
  websiteId: string,
  startAt: number,
  endAt: number,
  unit: DateUnit
) {
  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery(
    ['websiteStats', { workspaceId, websiteId, startAt, endAt }],
    () => {
      return getWorkspaceWebsiteStats(workspaceId, websiteId, {
        startAt,
        endAt,
        unit,
        timezone: getUserTimezone(),
      });
    }
  );

  return {
    stats,
    isLoading,
    refetch,
  };
}
