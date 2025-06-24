import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { isServerOnline } from '@tianji/shared';
import { ServerStatusInfo } from '../../../types';
import { Badge } from 'antd';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import dayjs from 'dayjs';
import { filesize } from 'filesize';
import prettyMilliseconds from 'pretty-ms';
import { UpDownCounter } from '../UpDownCounter';
import { ColorizedText } from './ColorizedText';
import {
  FaDocker,
  FaServer,
  FaClock,
  FaMemory,
  FaHdd,
  FaEye,
} from 'react-icons/fa';
import { LuCpu, LuNetwork } from 'react-icons/lu';
import { Button } from '../ui/button';
import { cn } from '@/utils/style';

interface ServerCardProps {
  server: ServerStatusInfo;
  onDockerClick?: (server: ServerStatusInfo) => void;
}

export const ServerCard: React.FC<ServerCardProps> = React.memo(
  ({ server, onDockerClick }) => {
    const { t } = useTranslation();
    const isOnline = isServerOnline(server);
    const cpuPercent = server.payload.cpu;
    const memoryPercent =
      (server.payload.memory_used / server.payload.memory_total) * 100;
    const hddPercent =
      (server.payload.hdd_used / server.payload.hdd_total) * 100;

    return (
      <Card
        className={cn(
          'w-full transition-all duration-200 hover:shadow-md',
          !isOnline && 'opacity-75'
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <FaServer
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isOnline ? 'text-green-600' : 'text-gray-400'
                )}
              />
              <span className="truncate">{server.name}</span>
              {server.payload.docker && (
                <Tooltip>
                  <TooltipTrigger>
                    <FaDocker className="h-4 w-4 flex-shrink-0 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('Docker in running in this server')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-2">
              {isOnline ? (
                <Badge status="success" text={t('online')} />
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge status="error" text="offline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('Last online: {{time}}', {
                      time: dayjs(server.updatedAt).format(
                        'YYYY-MM-DD HH:mm:ss'
                      ),
                    })}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardTitle>
          <div className="text-muted-foreground truncate text-sm">
            {server.hostname}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FaClock className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">{t('Uptime')}:</span>
              <span>
                {prettyMilliseconds(Number(server.payload.uptime) * 1000)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LuCpu className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">{t('CPU Load')}:</span>
              <span>{server.payload.load}</span>
            </div>
          </div>

          {/* Network */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LuNetwork className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{t('Network')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t('Total')}</div>
                <UpDownCounter
                  up={filesize(server.payload.network_out)}
                  down={filesize(server.payload.network_in)}
                />
              </div>
              <div>
                <div className="text-muted-foreground">{t('Traffic')}</div>
                <UpDownCounter
                  up={filesize(server.payload.network_tx) + '/s'}
                  down={filesize(server.payload.network_rx) + '/s'}
                />
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="space-y-3">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuCpu className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <ColorizedText percent={cpuPercent / 100}>
                  {cpuPercent}%
                </ColorizedText>
              </div>
              <Progress value={cpuPercent} className="h-2" />
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaMemory className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">RAM</span>
                </div>
                <div className="text-sm">
                  <ColorizedText percent={memoryPercent / 100}>
                    {filesize(server.payload.memory_used * 1024, { base: 2 })}
                  </ColorizedText>{' '}
                  / {filesize(server.payload.memory_total * 1024, { base: 2 })}
                </div>
              </div>
              <Progress value={memoryPercent} className="h-2" />
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaHdd className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">HDD</span>
                </div>
                <div className="text-sm">
                  <ColorizedText percent={hddPercent / 100}>
                    {filesize(server.payload.hdd_used * 1024 * 1024, {
                      base: 2,
                    })}
                  </ColorizedText>{' '}
                  /{' '}
                  {filesize(server.payload.hdd_total * 1024 * 1024, {
                    base: 2,
                  })}
                </div>
              </div>
              <Progress value={hddPercent} className="h-2" />
            </div>
          </div>

          {/* Updated Time */}
          <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
            <span>
              {t('Last updated')}: {dayjs(server.updatedAt).fromNow()}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <span className="cursor-help">
                  {dayjs(server.updatedAt).format('MM-DD HH:mm')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {dayjs(server.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Docker Info - Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start"
            onClick={() => onDockerClick?.(server)}
          >
            <span className="flex items-center gap-2">
              <FaEye className="h-4 w-4" />
              {t('View Detail')}
            </span>
          </Button>
        </CardContent>
      </Card>
    );
  }
);

ServerCard.displayName = 'ServerCard';
