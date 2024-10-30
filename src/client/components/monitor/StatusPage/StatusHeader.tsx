import React, { useMemo } from 'react';
import { cn } from '@/utils/style';
import { bodySchema } from './schema';
import { LuCheckCircle2, LuCircleSlash, LuAlertCircle } from 'react-icons/lu';
import { trpc } from '../../../api/trpc';
import { getMonitorProvider, getProviderDisplay } from '../provider';
import { takeRight, last } from 'lodash-es';
import dayjs from 'dayjs';

export const StatusPageHeader = ({ info, workspaceId }) => {
  const body = useMemo(() => {
    const res = bodySchema.safeParse(info.body);
    return res.success ? res.data : { groups: [] };
  }, [info.body]);
  const monitorContexts = useMemo(() => {
    const contexts = [];
    body.groups.forEach((group) => {
      group.children.forEach((item) => {
        if (item.type === 'monitor') {
          contexts.push({
            id: item.id,
            groupId: group.id,
            groupName: group.name,
          });
        }
      });
    });
    if (Array.isArray(info.monitorList)) {
      info.monitorList.forEach((monitor) => {
        contexts.push({
          id: monitor.id,
          groupId: 'deprecated',
          groupName: 'Legacy Monitors',
        });
      });
    }
    return contexts;
  }, [body, info.monitorList]);

  const recentDataQueries = monitorContexts.map((context) => {
    const { data: recentData = [] } = trpc.monitor.recentData.useQuery({
      workspaceId,
      monitorId: context.id,
      take: 1,
    });

    const items = useMemo(() => {
      return takeRight(
        [...Array.from({ length: 1 }).map(() => null), ...recentData],
        1
      );
    }, [recentData]);

    const provider = useMemo(
      () => getMonitorProvider(context.id),
      [context.id]
    );

    const latestStatus = useMemo(() => {
      const latestItem = last(items);
      if (!latestItem) return 'none';

      const { value, createdAt } = latestItem;
      const { text } = getProviderDisplay(value, provider);
      const title = `${dayjs(createdAt).format('YYYY-MM-DD HH:mm')} | ${text}`;
      return value < 0
        ? { status: 'error', title }
        : { status: 'health', title };
    }, [items, provider]);

    return {
      id: context.id,
      status: latestStatus.status,
      timestamp: last(items)?.createdAt,
    };
  });

  const { overallStatus, servicesCount, lastChecked } = useMemo(() => {
    let totalCount = 0;
    let errorCount = 0;
    let latestTimestamp = null;

    recentDataQueries.forEach((query) => {
      if (!query) return;

      totalCount += 1;

      if (query.status != 'health') {
        errorCount += 1;
      }

      if (
        !latestTimestamp ||
        (query.timestamp && query.timestamp > latestTimestamp)
      ) {
        latestTimestamp = query.timestamp;
      }
    });

    let status = 'unknown';
    let uprate = ((totalCount - errorCount) / totalCount) * 100;

    if (uprate > 90) {
      status = 'operational';
    } else if (uprate > 50) {
      status = 'degraded';
    } else if (uprate > 0) {
      status = 'offline';
    }

    return {
      overallStatus: status,
      servicesCount: totalCount,
      lastChecked: latestTimestamp,
    };
  }, [recentDataQueries]);

  const statusConfig = {
    operational: {
      text: 'All Systems Operational',
      icon: LuCheckCircle2,
      iconColor: 'text-green-500',
    },
    degraded: {
      text: 'Partial System Outage',
      icon: LuAlertCircle,
      iconColor: 'text-yellow-500',
    },
    offline: {
      text: 'Major System Outage',
      icon: LuCircleSlash,
      iconColor: 'text-red-500',
    },
    unknown: {
      text: 'Status Unknown',
      icon: LuAlertCircle,
      iconColor: 'text-gray-500',
    },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  const formatDate = (date) => {
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: true,
    };
    const formatted = new Date(date).toLocaleString('en-US', options);
    const [monthDay, time] = formatted.split(',');
    return `Last updated on ${monthDay} at${time} UTC`;
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <StatusIcon
        className={cn('h-12 w-12', config.iconColor)}
        aria-hidden="true"
      />
      <h1 className="pb-2 pt-4 text-4xl font-bold">{config.text}</h1>
      {lastChecked && (
        <p className="text-md text-gray-600 dark:text-gray-400">
          {formatDate(lastChecked)}
        </p>
      )}
    </div>
  );
};

export default StatusPageHeader;
