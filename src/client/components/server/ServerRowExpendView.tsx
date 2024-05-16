import React, { useMemo, useState } from 'react';
import {
  ServerStatusInfo,
  ServerStatusDockerContainerPayload,
} from '../../../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Empty } from 'antd';
import { DiDocker } from 'react-icons/di';
import { useTranslation } from '@i18next-toolkit/react';
import { DataTable, createColumnHelper } from '../DataTable';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { filesize } from 'filesize';
import { UpDownCounter } from '../UpDownCounter';
import dayjs from 'dayjs';
import { Switch } from '../ui/switch';

const columnHelper = createColumnHelper<ServerStatusDockerContainerPayload>();

export const ServerRowExpendView: React.FC<{ row: ServerStatusInfo }> =
  React.memo((props) => {
    const { row } = props;
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    const columns = useMemo(() => {
      return [
        columnHelper.display({
          header: t('Image'),
          size: 90,
          cell: (props) => (
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <span>{props.row.original.image}</span>
              </TooltipTrigger>
              <TooltipContent>{props.row.original.imageId}</TooltipContent>
            </Tooltip>
          ),
        }),
        columnHelper.display({
          header: t('State'),
          size: 90,
          cell: (props) => (
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <span>{props.row.original.state}</span>
              </TooltipTrigger>
              <TooltipContent>{props.row.original.status}</TooltipContent>
            </Tooltip>
          ),
        }),
        columnHelper.accessor('ports', {
          header: t('ports'),
          size: 130,
          cell: (props) =>
            props
              .getValue()
              .map((item, i) => (
                <div
                  key={i}
                >{`${item.IP}:${item.PublicPort} -> ${item.PrivatePort} / ${item.Type}`}</div>
              )),
        }),
        columnHelper.accessor('cpuPercent', {
          header: 'CPU(%)',
          size: 90,
          cell: (props) => `${props.getValue() * 100}%`,
        }),
        columnHelper.display({
          header: t('Memory'),
          size: 120,
          cell: (props) => (
            <div className="text-xs">
              <div>{filesize(props.row.original.memory, { base: 2 })} / </div>
              <div>{filesize(props.row.original.memLimit, { base: 2 })}</div>
            </div>
          ),
        }),
        columnHelper.display({
          header: t('Traffic'),
          size: 130,
          cell: (props) => (
            <UpDownCounter
              up={filesize(props.row.original.networkTx, { base: 2 }) + '/s'}
              down={filesize(props.row.original.networkRx, { base: 2 }) + '/s'}
            />
          ),
        }),
        columnHelper.display({
          header: t('Disk read/write'),
          size: 120,
          cell: (props) => (
            <div className="text-xs">
              <div>{filesize(props.row.original.ioRead)} / </div>
              <div>{filesize(props.row.original.ioWrite)}</div>
            </div>
          ),
        }),
        columnHelper.accessor('createdAt', {
          header: t('Created At'),
          size: 130,
          cell: (props) => (
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <span>{dayjs.unix(props.getValue()).fromNow()}</span>
              </TooltipTrigger>
              <TooltipContent>
                {dayjs.unix(props.getValue()).format('YYYY-MM-DD HH:mm:ss')}
              </TooltipContent>
            </Tooltip>
          ),
        }),
      ];
    }, [t]);

    const data = showAll
      ? row.payload.docker
      : row.payload.docker?.filter((item) => item.state === 'running');

    return (
      <div className="p-2">
        <Tabs defaultValue="docker">
          <TabsList>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="history" disabled={true}>
              History(Comming Soon)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="docker">
            {!row.payload.docker ? (
              <Empty
                image={<DiDocker size={100} />}
                description={t(
                  'Docker is adrift at sea, unable to find its way. Please start Docker to get back on course.'
                )}
              />
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Switch checked={showAll} onCheckedChange={setShowAll} />
                  <div>{t('Show All')}</div>
                </div>
                <DataTable columns={columns} data={data} />
              </div>
            )}
          </TabsContent>
          <TabsContent value="history">Comming Soon</TabsContent>
        </Tabs>
      </div>
    );
  });
ServerRowExpendView.displayName = 'ServerRowExpendView';
