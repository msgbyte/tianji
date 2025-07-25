import React, { useMemo } from 'react';
import { DataTable, createColumnHelper } from '../DataTable';
import { useTranslation } from '@i18next-toolkit/react';
import { useIntervalUpdate } from '@/hooks/useIntervalUpdate';
import { useServerMap } from './useServerMap';
import { isServerOnline } from '@tianji/shared';
import { max, orderBy } from 'lodash-es';
import { ServerStatusInfo } from '../../../types';
import { Badge } from 'antd';
import {
  SimpleTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import dayjs from 'dayjs';
import { filesize } from 'filesize';
import prettyMilliseconds from 'pretty-ms';
import { UpDownCounter } from '../UpDownCounter';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { ServerRowExpendView } from './ServerRowExpendView';
import { FaDocker } from 'react-icons/fa';
import { ColorizedText } from './ColorizedText';
import { CountryName } from '../CountryName';

const columnHelper = createColumnHelper<ServerStatusInfo>();

interface ServerListProps {
  hideOfflineServer: boolean;
}
export const ServerList: React.FC<ServerListProps> = React.memo((props) => {
  const { t } = useTranslation();
  const serverMap = useServerMap();
  const inc = useIntervalUpdate(2 * 1000);
  const { hideOfflineServer } = props;

  const dataSource = useMemo(
    () =>
      orderBy(Object.values(serverMap), 'name', 'asc').filter((info) => {
        if (hideOfflineServer) {
          return isServerOnline(info);
        }

        return true;
      }), // make online server is up and offline is down
    [serverMap, inc, hideOfflineServer]
  );
  const lastUpdatedAt = max(dataSource.map((d) => d.updatedAt));

  const columns = useMemo(() => {
    return [
      columnHelper.display({
        header: t('Status'),
        size: 90,
        cell: (props) => (
          <div className="flex gap-2">
            {isServerOnline(props.row.original) ? (
              <Badge status="success" text={t('online')} />
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <Badge status="error" text="offline" />
                </TooltipTrigger>
                <TooltipContent>
                  {t('Last online: {{time}}', {
                    time: dayjs(props.row.original.updatedAt).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ),
                  })}
                </TooltipContent>
              </Tooltip>
            )}

            {props.row.original.payload.docker && (
              <Tooltip>
                <TooltipTrigger onClick={props.row.getToggleExpandedHandler()}>
                  <FaDocker />
                </TooltipTrigger>
                <TooltipContent>
                  {t('Docker in running in this server')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('name', {
        header: t('Node Name'),
        size: 150,
      }),
      columnHelper.accessor('hostname', {
        header: t('Host Name'),
        size: 150,
      }),
      columnHelper.display({
        header: t('IP'),
        size: 150,
        cell: (props) =>
          props.row.original.payload.country ? (
            <SimpleTooltip content={props.row.original.payload.ip}>
              <CountryName country={props.row.original.payload.country} />
            </SimpleTooltip>
          ) : (
            <span>{props.row.original.payload.ip}</span>
          ),
      }),
      columnHelper.accessor('payload.uptime', {
        header: t('Uptime'),
        size: 150,
        cell: (props) => prettyMilliseconds(Number(props.getValue()) * 1000),
      }),
      columnHelper.accessor('payload.load', {
        header: t('CPU Load'),
        size: 85,
      }),
      columnHelper.display({
        header: t('Network'),
        size: 110,
        cell: (props) => (
          <UpDownCounter
            up={filesize(props.row.original.payload.network_out)}
            down={filesize(props.row.original.payload.network_in)}
          />
        ),
      }),
      columnHelper.display({
        header: t('Traffic'),
        size: 130,
        cell: (props) => (
          <UpDownCounter
            up={filesize(props.row.original.payload.network_tx) + '/s'}
            down={filesize(props.row.original.payload.network_rx) + '/s'}
          />
        ),
      }),
      columnHelper.accessor('payload.cpu', {
        header: t('CPU Usage'),
        size: 100,
        cell: (props) => (
          <ColorizedText percent={props.getValue() / 100}>
            {props.getValue()}%
          </ColorizedText>
        ),
      }),
      columnHelper.display({
        header: 'RAM',
        size: 120,
        cell: (props) => (
          <div className="text-xs">
            <div>
              <ColorizedText
                percent={
                  props.row.original.payload.memory_used /
                  props.row.original.payload.memory_total
                }
              >
                {filesize(props.row.original.payload.memory_used * 1024, {
                  base: 2,
                })}
              </ColorizedText>{' '}
              /{' '}
            </div>
            <div>
              {filesize(props.row.original.payload.memory_total * 1024, {
                base: 2,
              })}
            </div>
          </div>
        ),
      }),
      columnHelper.display({
        header: 'HDD',
        size: 120,
        cell: (props) => (
          <div className="text-xs">
            <div>
              <ColorizedText
                percent={
                  props.row.original.payload.hdd_used /
                  props.row.original.payload.hdd_total
                }
              >
                {filesize(props.row.original.payload.hdd_used * 1024 * 1024, {
                  base: 2,
                })}
              </ColorizedText>{' '}
              /{' '}
            </div>
            <div>
              {filesize(props.row.original.payload.hdd_total * 1024 * 1024, {
                base: 2,
              })}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: t('updatedAt'),
        size: 130,
        cell: (props) => (
          <Tooltip>
            <TooltipTrigger className="cursor-default">
              <span>{dayjs(props.getValue()).fromNow()}</span>
            </TooltipTrigger>
            <TooltipContent>
              {dayjs(props.getValue()).format('YYYY-MM-DD HH:mm:ss')}
            </TooltipContent>
          </Tooltip>
        ),
      }),
    ];
  }, [t]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 text-right text-sm opacity-80">
        {t('Last updated at: {{date}}', {
          date: dayjs(lastUpdatedAt).format('YYYY-MM-DD HH:mm:ss'),
        })}
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <ScrollBar orientation="horizontal" />
        <DataTable
          columns={columns}
          data={dataSource}
          ExpandComponent={ServerRowExpendView}
        />
      </ScrollArea>
    </div>
  );
});
ServerList.displayName = 'ServerList';
