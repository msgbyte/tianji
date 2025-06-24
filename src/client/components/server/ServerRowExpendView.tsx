import React, { useMemo, useState } from 'react';
import {
  ServerStatusInfo,
  ServerStatusDockerContainerPayload,
  ProcessInfo,
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
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { TimeEventChart, useTimeEventChartConfig } from '../chart/TimeEventChart';

const columnHelper = createColumnHelper<ServerStatusDockerContainerPayload>();
const processColumnHelper = createColumnHelper<ProcessInfo>();

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
              .map((item, i) =>
                item.IP ? (
                  <div
                    key={i}
                  >{`${item.IP}:${item.PublicPort} -> ${item.PrivatePort} / ${item.Type}`}</div>
                ) : (
                  <div key={i}>{`${item.PrivatePort} / ${item.Type}`}</div>
                )
              ),
        }),
        columnHelper.accessor('cpuPercent', {
          header: 'CPU(%)',
          size: 90,
          cell: (props) => `${Number(props.getValue().toFixed(2))}%`,
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

    const cpuColumns = useMemo(() => {
      return [
        processColumnHelper.accessor('name', { header: t('Name'), size: 150 }),
        processColumnHelper.accessor('pid', { header: 'PID', size: 80 }),
        processColumnHelper.accessor('cpu', {
          header: 'CPU(%)',
          size: 90,
          cell: (props) => `${props.getValue().toFixed(1)}%`,
        }),
      ];
    }, [t]);

    const memColumns = useMemo(() => {
      return [
        processColumnHelper.accessor('name', { header: t('Name'), size: 150 }),
        processColumnHelper.accessor('pid', { header: 'PID', size: 80 }),
        processColumnHelper.accessor('memory', {
          header: t('Memory'),
          size: 120,
          cell: (props) => filesize(props.getValue() * 1024, { base: 2 }),
        }),
      ];
    }, [t]);

    const data = showAll
      ? row.payload.docker
      : row.payload.docker?.filter((item) => item.state === 'running');

    const workspaceId = useCurrentWorkspaceId();
    const { data: history = [] } = trpc.serverStatus.history.useQuery({
      workspaceId,
      name: row.name,
    });

    const chartData = useMemo(() => {
      return history.map((h) => ({
        date: dayjs(h.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        cpu: h.payload.cpu,
        memory: (h.payload.memory_used / h.payload.memory_total) * 100,
      }));
    }, [history]);

    const chartConfig = useTimeEventChartConfig(chartData);

    return (
      <div className="p-2">
        <Tabs defaultValue="docker">
          <TabsList>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
                <DataTable columns={columns} data={data ?? []} />
              </div>
            )}
          </TabsContent>
          <TabsContent value="process">
            <div className="space-y-4">
              <div>
                <div className="mb-2 font-medium">Top CPU Processes</div>
                <DataTable columns={cpuColumns} data={row.payload.top_cpu_processes ?? []} />
              </div>
              <div>
                <div className="mb-2 font-medium">Top Memory Processes</div>
                <DataTable columns={memColumns} data={row.payload.top_memory_processes ?? []} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history">
            {chartData.length === 0 ? (
              <div className="text-muted-foreground flex h-32 items-center justify-center">
                {t('No Data')}
              </div>
            ) : (
              <TimeEventChart
                data={chartData}
                unit="minute"
                chartConfig={chartConfig}
                chartType="line"
                isTrendingMode={true}
                valueFormatter={(v) => `${v.toFixed(2)}%`}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  });
ServerRowExpendView.displayName = 'ServerRowExpendView';
