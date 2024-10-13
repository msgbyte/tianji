import { AppRouterOutput, trpc } from '@/api/trpc';
import React, { useMemo } from 'react';
import { bodySchema } from './schema';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { MonitorListItem } from '../MonitorListItem';
import { cn } from '@/utils/style';
import { Tooltip } from '@/components/ui/tooltip';
import { MonitorHealthBar } from '../MonitorHealthBar';
import { HealthBar, HealthStatus } from '@/components/HealthBar';

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
                      id={item.id}
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
  id: string;
  showCurrent: boolean;
  workspaceId: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { data: info } = trpc.monitor.getPublicInfo.useQuery(
    {
      monitorIds: [props.id],
    },
    {
      select: (data) => data[0],
    }
  );

  const { data: list = [], isLoading } = trpc.monitor.publicSummary.useQuery({
    workspaceId: props.workspaceId,
    monitorId: props.id,
  });

  if (isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        'mb-1 flex items-center overflow-hidden rounded-lg bg-green-500 bg-opacity-0 px-4 py-3 hover:bg-opacity-10'
      )}
    >
      {/* <div>
        <span
          className={cn(
            'inline-block min-w-[62px] rounded-full p-0.5 text-center text-white',
            upPercent === 100 ? 'bg-green-400' : 'bg-amber-400'
          )}
        >
          {upPercent}%
        </span>
      </div> */}

      <div className="flex-1 pl-2">
        <div className="text-nowrap text-base">{info?.name}</div>
      </div>

      {/* {props.showCurrent && latestResponse && (
        <Tooltip title={t('Current')}>
          <div className="px-2 text-sm text-gray-800 dark:text-gray-400">
            {latestResponse}
          </div>
        </Tooltip>
      )} */}

      <div className="flex-shrink basis-[260px] items-center overflow-hidden px-1">
        <HealthBar
          className="justify-end"
          size="small"
          beats={[...list].reverse().map((item) => {
            let status: HealthStatus = 'none';

            if (item.upRate === 1) {
              status = 'health';
            } else if (item.upRate === 0 && item.totalCount === 0) {
              status = 'none';
            } else if (item.upCount === 0 && item.totalCount !== 0) {
              status = 'error';
            } else {
              status = 'warning';
            }

            return {
              status,
              title: `${item.day} | (${item.upCount}/${item.totalCount}) ${item.upRate}%`,
            };
          })}
        />
      </div>
    </div>
  );

  // return (
  //   <MonitorListItem
  //     key={item.id}
  //     workspaceId={props.workspaceId}
  //     monitorId={item.id}
  //     monitorName={item.name}
  //     monitorType={item.type}
  //     showCurrentResponse={props.showCurrent}
  //   />
  // );
});
StatusItemMonitor.displayName = 'StatusItemMonitor';
