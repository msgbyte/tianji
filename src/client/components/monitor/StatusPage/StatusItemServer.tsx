import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Badge } from 'antd';
import { isServerOnline } from '@tianji/shared';
import { useStatusPageStore } from './store';
import { useWatch } from '@/hooks/useWatch';
import { trpc } from '@/api/trpc';
import { refetchInterval } from './const';
import { ServerCard } from '../../server/ServerCard';
import { ServerStatusInfo } from '../../../../types';

interface StatusItemServerProps {
  name: string;
  workspaceId: string;
  showDetail?: boolean;
}

export const StatusItemServer: React.FC<StatusItemServerProps> = React.memo(
  ({ name, workspaceId, showDetail = true }) => {
    const { t } = useTranslation();
    const updateLastUpdatedAt = useStatusPageStore(
      (s) => s.updateLastUpdatedAt
    );

    const { data: serverMap = {}, dataUpdatedAt } =
      trpc.serverStatus.publicInfo.useQuery(
        {
          workspaceId,
          serverNames: [name],
        },
        {
          refetchInterval,
        }
      );

    useWatch([dataUpdatedAt], () => {
      if (dataUpdatedAt) {
        updateLastUpdatedAt(dataUpdatedAt);
      }
    });

    const server = serverMap[name];
    const isOnline = server
      ? isServerOnline({
          ...server,
          timeout: refetchInterval * 2, // use 2x refetchInterval as timeout
          payload: server.payload ?? {},
        } as any)
      : false;

    if (!server) {
      return (
        <div className="flex items-center px-4 py-3">
          <span className="flex-1 text-base">{name}</span>
          <Badge status="error" text={t('Not Found')} />
        </div>
      );
    }

    if (!showDetail) {
      return (
        <div className="flex items-center px-4 py-3">
          <span className="flex-1 text-base">{server?.name ?? name}</span>
          <Badge
            status={isOnline ? 'success' : 'error'}
            text={isOnline ? t('Online') : t('Offline')}
          />
        </div>
      );
    }

    // Convert server data to ServerStatusInfo format for ServerCard
    const serverInfo: ServerStatusInfo = {
      ...server,
      timeout: refetchInterval * 2,
      payload: server.payload ?? {},
    };

    return <ServerCard server={serverInfo} showDetailButton={false} />;
  }
);
StatusItemServer.displayName = 'StatusItemServer';
