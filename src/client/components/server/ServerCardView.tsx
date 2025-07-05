import React, { useMemo, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useIntervalUpdate } from '@/hooks/useIntervalUpdate';
import { useServerMap } from './useServerMap';
import { isServerOnline } from '@tianji/shared';
import { max, orderBy } from 'lodash-es';
import { ServerStatusInfo } from '../../../types';
import dayjs from 'dayjs';
import { FaDocker, FaServer } from 'react-icons/fa';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { ServerRowExpendView } from './ServerRowExpendView';
import { ServerCard } from './ServerCard';

interface ServerCardViewProps {
  hideOfflineServer: boolean;
}

export const ServerCardView: React.FC<ServerCardViewProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const serverMap = useServerMap();
    const inc = useIntervalUpdate(2 * 1000);
    const { hideOfflineServer } = props;
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedServer, setSelectedServer] =
      useState<ServerStatusInfo | null>(null);

    const dataSource = useMemo(
      () =>
        orderBy(Object.values(serverMap), 'name', 'asc').filter((info) => {
          if (hideOfflineServer) {
            return isServerOnline(info);
          }
          return true;
        }),
      [serverMap, inc, hideOfflineServer]
    );

    const lastUpdatedAt = max(dataSource.map((d) => d.updatedAt));

    const handleDetailClick = (server: ServerStatusInfo) => {
      setSelectedServer(server);
      setDetailDrawerOpen(true);
    };

    return (
      <div className="h-full space-y-4">
        <div className="text-right text-sm opacity-80">
          {t('Last updated at: {{date}}', {
            date: dayjs(lastUpdatedAt).format('YYYY-MM-DD HH:mm:ss'),
          })}
        </div>

        {dataSource.length === 0 ? (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            {hideOfflineServer ? t('No online servers') : t('No servers')}
          </div>
        ) : (
          <div className="grid auto-rows-max grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {dataSource.map((server) => (
              <ServerCard
                key={server.name}
                server={server}
                showDetailButton={true}
                onDetailClick={handleDetailClick}
              />
            ))}
          </div>
        )}

        {/* Detail Drawer */}
        <Drawer open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <FaServer className="h-5 w-5" />
                {selectedServer?.name} - {t('Detail Information')}
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              {selectedServer && <ServerRowExpendView row={selectedServer} />}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }
);
ServerCardView.displayName = 'ServerCardView';
