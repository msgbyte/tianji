import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/style';
import { bodySchema } from './schema';
import { LuCircleCheckBig, LuCircleSlash, LuCircleAlert } from 'react-icons/lu';
import { AppRouterOutput, trpc } from '../../../api/trpc';
import { takeRight, last } from 'lodash-es';
import dayjs from 'dayjs';
import { IconType } from 'react-icons';
import { useTranslation } from '@i18next-toolkit/react';
import { useStatusPageStore } from './store';
import { useEvent } from '@/hooks/useEvent';
import { useInterval } from 'ahooks';
import { refetchInterval } from './const';
import { useWatch } from '@/hooks/useWatch';
import { isServerOnline } from '@tianji/shared';

interface StatusPageHeaderProps {
  info: NonNullable<AppRouterOutput['monitor']['getPageInfo']>;
  workspaceId: string;
}

interface ContextItem {
  id: string;
  groupId: string;
  groupName: string;
  type: 'monitor' | 'server';
}

type StatusType = 'operational' | 'degraded' | 'offline' | 'unknown';

export const StatusPageHeader: React.FC<StatusPageHeaderProps> = React.memo(
  ({ info, workspaceId }) => {
    const { t } = useTranslation();
    const body = useMemo(() => {
      const res = bodySchema.safeParse(info.body);
      return res.success ? res.data : { groups: [] };
    }, [info.body]);
    const lastUpdatedAt = useStatusPageStore((state) => state.lastUpdatedAt);
    const updateLastUpdatedAt = useStatusPageStore(
      (state) => state.updateLastUpdatedAt
    );
    const trpcUtils = trpc.useUtils();

    const allContexts = useMemo(() => {
      const contexts: ContextItem[] = [];

      // Add monitors and servers from body groups
      body.groups.forEach((group) => {
        group.children.forEach((item) => {
          contexts.push({
            id: item.id,
            groupId: group.key,
            groupName: group.title,
            type: item.type,
          });
        });
      });

      // Add legacy monitors
      if (Array.isArray(info.monitorList)) {
        info.monitorList.forEach((monitor) => {
          contexts.push({
            id: monitor.id,
            groupId: 'deprecated',
            groupName: 'Legacy Monitors',
            type: 'monitor',
          });
        });
      }
      return contexts;
    }, [body, info.monitorList]);

    const monitorContexts = useMemo(
      () => allContexts.filter((ctx) => ctx.type === 'monitor'),
      [allContexts]
    );

    const serverContexts = useMemo(
      () => allContexts.filter((ctx) => ctx.type === 'server'),
      [allContexts]
    );

    const [recentDataQueries, setRecentDataQueries] = useState<
      {
        id: string;
        status: string | undefined;
        timestamp: number;
        type: 'monitor' | 'server';
      }[]
    >([]);

    const fetchDataQueries = useEvent(async () => {
      // Fetch monitor data
      const monitorDataPromises = monitorContexts.map(async (context) => {
        const recentData = await trpcUtils.monitor.recentData.fetch({
          workspaceId,
          monitorId: context.id,
          take: 1,
        });

        const items = takeRight(
          [...Array.from({ length: 1 }).map(() => null), ...recentData],
          1
        );

        const latestItem = last(items);
        if (!latestItem) {
          return {
            id: context.id,
            status: undefined,
            timestamp: dayjs(last(items)?.createdAt).valueOf(),
            type: 'monitor' as const,
          };
        }

        return {
          id: context.id,
          status: latestItem.value < 0 ? 'error' : 'health',
          timestamp: dayjs(last(items)?.createdAt).valueOf(),
          type: 'monitor' as const,
        };
      });

      // Fetch server data
      const serverDataPromises =
        serverContexts.length > 0
          ? trpcUtils.serverStatus.publicInfo
              .fetch({
                workspaceId,
                serverNames: serverContexts.map((ctx) => ctx.id),
              })
              .then((serverMap) => {
                return serverContexts.map((context) => {
                  const server = serverMap[context.id];
                  if (!server) {
                    return {
                      id: context.id,
                      status: 'error' as const,
                      timestamp: Date.now(),
                      type: 'server' as const,
                    };
                  }

                  const online = isServerOnline({
                    ...server,
                    timeout: refetchInterval * 2,
                    payload: server.payload ?? {},
                  } as any);

                  return {
                    id: context.id,
                    status: online ? 'health' : 'error',
                    timestamp: server.updatedAt,
                    type: 'server' as const,
                  };
                });
              })
          : Promise.resolve([]);

      const [monitorResults, serverResults] = await Promise.all([
        Promise.all(monitorDataPromises),
        serverDataPromises,
      ]);

      updateLastUpdatedAt(dayjs().valueOf());

      setRecentDataQueries([...monitorResults, ...serverResults]);
    });

    useInterval(fetchDataQueries, refetchInterval, {
      immediate: true,
    });

    useWatch([info.id], () => {
      fetchDataQueries();
    });

    const { overallStatus } = useMemo(() => {
      let totalCount = 0;
      let errorCount = 0;

      recentDataQueries.forEach((query) => {
        if (!query) {
          return;
        }

        totalCount += 1;

        if (query.status != 'health') {
          errorCount += 1;
        }
      });

      let status: string = 'unknown';
      let uprate =
        totalCount > 0 ? ((totalCount - errorCount) / totalCount) * 100 : 0;

      if (uprate > 90) {
        status = 'operational';
      } else if (uprate > 50) {
        status = 'degraded';
      } else if (uprate > 0) {
        status = 'offline';
      }

      return {
        overallStatus: status as StatusType,
        servicesCount: totalCount,
      };
    }, [recentDataQueries]);

    const statusConfig: Record<
      StatusType,
      { text: string; icon: IconType; iconColor: string }
    > = {
      operational: {
        text: t('All Systems Operational'),
        icon: LuCircleCheckBig,
        iconColor: 'text-green-500',
      },
      degraded: {
        text: t('Partial System Outage'),
        icon: LuCircleAlert,
        iconColor: 'text-yellow-500',
      },
      offline: {
        text: t('Major System Outage'),
        icon: LuCircleSlash,
        iconColor: 'text-red-500',
      },
      unknown: {
        text: t('Status Unknown'),
        icon: LuCircleAlert,
        iconColor: 'text-gray-500',
      },
    };

    const config = statusConfig[overallStatus];
    const StatusIcon = config.icon;

    const formatDate = (date: number) => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const formatted = new Date(date).toLocaleString('en-US', options);
      return `${t('Last updated')} ${formatted}`;
    };

    return (
      <div className="flex flex-col items-center space-y-2">
        <StatusIcon
          className={cn('h-12 w-12', config.iconColor)}
          aria-hidden="true"
        />
        <h1 className="pb-2 pt-4 text-4xl font-bold">{config.text}</h1>
        {lastUpdatedAt && (
          <p className="text-md text-gray-600 dark:text-gray-400">
            {formatDate(lastUpdatedAt)}
          </p>
        )}
      </div>
    );
  }
);
StatusPageHeader.displayName = 'StatusPageHeader';
