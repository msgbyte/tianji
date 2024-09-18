import { AppRouterOutput, trpc } from '@/api/trpc';
import React, { useMemo } from 'react';
import { bodySchema } from './schema';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { MonitorListItem } from '../MonitorListItem';

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
  const { data: list = [], isLoading } = trpc.monitor.getPublicInfo.useQuery({
    monitorIds: [props.id],
  });

  if (isLoading) {
    return null;
  }

  const item = list[0];

  if (!item) {
    return null;
  }

  return (
    <MonitorListItem
      key={item.id}
      workspaceId={props.workspaceId}
      monitorId={item.id}
      monitorName={item.name}
      monitorType={item.type}
      showCurrentResponse={props.showCurrent}
    />
  );
});
StatusItemMonitor.displayName = 'StatusItemMonitor';
