import { AppRouterOutput, trpc } from '@/api/trpc';
import React, { useMemo, useReducer } from 'react';
import { bodySchema } from './schema';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { cn } from '@/utils/style';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HealthBar } from '@/components/HealthBar';
import { getMonitorProvider, getProviderDisplay } from '../provider';
import {
  getStatusBgColorClassName,
  parseHealthStatusByPercent,
} from '@/utils/health';
import { MonitorPublicDataChart } from '../MonitorPublicDataChart';

interface StatusPageBodyProps {
  workspaceId: string;
  info: NonNullable<AppRouterOutput['monitor']['getPageInfo']>;
}
export const StatusPageBody: React.FC<StatusPageBodyProps> = React.memo(
  (props) => {
    const { info } = props;
    const { t } = useTranslation();

    const body = useMemo(() => {
      const res = bodySchema.safeParse(info.body);
      if (res.success) {
        return res.data;
      } else {
        return { groups: [] };
      }
    }, [info.body]);

    return (
      <div>
        {body.groups.map((group) => (
          <div key={group.key} className="mb-6">
            <div className="mb-2 text-lg font-semibold">{group.title}</div>

            <div className="flex flex-col gap-4 rounded-md border border-gray-200 p-2.5 dark:border-gray-700">
              {group.children.length === 0 && (
                <Empty description={t('No any monitor has been set')} />
              )}

              {group.children.map((item) => {
                if (item.type === 'monitor') {
                  return (
                    <StatusItemMonitor
                      key={item.key}
                      workspaceId={props.workspaceId}
                      monitorId={item.id}
                      showCurrent={item.showCurrent ?? false}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
StatusPageBody.displayName = 'StatusPageBody';

export const StatusItemMonitor: React.FC<{
  monitorId: string;
  showCurrent: boolean;
  workspaceId: string;
}> = React.memo((props) => {
  const { data: info } = trpc.monitor.getPublicInfo.useQuery(
    {
      monitorIds: [props.monitorId],
    },
    {
      select: (data) => data[0],
    }
  );

  const { data: list = [], isLoading } = trpc.monitor.publicSummary.useQuery({
    workspaceId: props.workspaceId,
    monitorId: props.monitorId,
  });

  const [showChart, toggleShowChart] = useReducer((state) => !state, false);

  const { summaryStatus, summaryPercent } = useMemo(() => {
    let upCount = 0;
    let totalCount = 0;
    list.forEach((item) => {
      upCount += item.upCount;
      totalCount += item.totalCount;
    });

    const percent = Number(((upCount / totalCount) * 100).toFixed(1));

    return {
      summaryPercent: percent,
      summaryStatus: parseHealthStatusByPercent(percent, totalCount),
    };
  }, [list]);

  if (isLoading) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          'mb-1 flex cursor-pointer items-center overflow-hidden rounded-lg bg-green-500 bg-opacity-0 px-4 py-3 hover:bg-opacity-10'
        )}
        onClick={toggleShowChart}
      >
        <div>
          <span
            className={cn(
              'inline-block min-w-[62px] rounded-full p-0.5 text-center text-white',
              getStatusBgColorClassName(summaryStatus)
            )}
          >
            {summaryPercent}%
          </span>
        </div>

        <div className="flex-1 pl-2">
          <div className="text-nowrap text-base">{info?.name}</div>
        </div>

        {props.showCurrent && info && (
          <MonitorLatestResponse
            workspaceId={props.workspaceId}
            monitorId={info.id}
            monitorType={info.type}
          />
        )}

        <div className="flex-shrink basis-[250px] items-center overflow-hidden px-1">
          <HealthBar
            className="justify-end"
            size="small"
            beats={[...list].reverse().map((item) => {
              const status = parseHealthStatusByPercent(
                item.upRate,
                item.totalCount
              );

              return {
                status,
                title: `${item.day} | (${item.upCount}/${item.totalCount}) ${item.upRate}%`,
              };
            })}
          />
        </div>
      </div>

      {showChart && (
        <MonitorPublicDataChart
          workspaceId={props.workspaceId}
          monitorId={props.monitorId}
        />
      )}
    </div>
  );
});
StatusItemMonitor.displayName = 'StatusItemMonitor';

const MonitorLatestResponse: React.FC<{
  workspaceId: string;
  monitorId: string;
  monitorType: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { data: recentText } = trpc.monitor.recentData.useQuery(
    {
      workspaceId: props.workspaceId,
      monitorId: props.monitorId,
      take: 1,
    },
    {
      select: (data) => {
        const provider = getMonitorProvider(props.monitorType);

        const value = data[0].value;

        if (!value) {
          return '';
        }

        const { text } = getProviderDisplay(value, provider);

        return text;
      },
    }
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>
        <div className="px-2 text-sm text-gray-800 dark:text-gray-400">
          {recentText}
        </div>
      </TooltipTrigger>
      <TooltipContent>{t('Current')}</TooltipContent>
    </Tooltip>
  );
});
MonitorLatestResponse.displayName = 'MonitorLatestResponse';
