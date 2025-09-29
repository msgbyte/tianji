import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetDataSection } from '@/components/ui/sheet';
import dayjs from 'dayjs';
import { cn } from '@/utils/style';
import { formatDate } from '@/utils/date';
import { DataRender } from '../DataRender';

interface WorkerExecutionDetailProps {
  vertical?: boolean;
  execution: {
    id?: string;
    status: string;
    duration?: number | null;
    memoryUsed?: number | null;
    cpuTime?: number | null;
    createdAt: string;
    requestPayload?: unknown;
    error?: string | null;
    responsePayload?: unknown;
    logs?: (string | number)[][] | null;
  };
}

export const WorkerExecutionDetail: React.FC<WorkerExecutionDetailProps> =
  React.memo((props) => {
    const { vertical = false, execution } = props;
    const { t } = useTranslation();

    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 p-1">
          <div className={cn(vertical ? 'flex flex-col' : 'grid grid-cols-2')}>
            {execution.id && (
              <SheetDataSection label="ID">{execution.id}</SheetDataSection>
            )}

            <SheetDataSection label={t('Status')}>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    execution.status === 'Success' ? 'default' : 'destructive'
                  }
                >
                  {execution.status}
                </Badge>
              </div>
            </SheetDataSection>

            <SheetDataSection label={t('Duration')}>
              {execution.duration !== null && execution.duration !== undefined
                ? `${execution.duration}ms`
                : '-'}
            </SheetDataSection>

            <SheetDataSection label={t('Memory Used')}>
              {execution.memoryUsed !== null &&
              execution.memoryUsed !== undefined
                ? `${Math.round(execution.memoryUsed / 1024)}KB`
                : '-'}
            </SheetDataSection>

            <SheetDataSection label={t('CPU Time')}>
              {execution.cpuTime !== null && execution.cpuTime !== undefined
                ? `${Math.round(execution.cpuTime / 1000)}μs`
                : '-'}
            </SheetDataSection>

            <SheetDataSection label={t('Created At')}>
              {dayjs(execution.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </SheetDataSection>
          </div>

          {execution.requestPayload !== null &&
            execution.requestPayload !== undefined && (
              <SheetDataSection label={t('Request')}>
                <div className="mt-1 max-h-[400px] overflow-auto rounded-md bg-gray-100 p-3 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                  <DataRender type="json" value={execution.requestPayload} />
                </div>
              </SheetDataSection>
            )}

          {execution.responsePayload !== null &&
            execution.responsePayload !== undefined && (
              <SheetDataSection label={t('Response')}>
                <div className="mt-1 max-h-[400px] overflow-auto rounded-md bg-gray-100 p-3 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                  <DataRender type="json" value={execution.responsePayload} />
                </div>
              </SheetDataSection>
            )}

          {execution.error && (
            <SheetDataSection label={t('Error')}>
              <div className="mt-1 rounded-md border border-red-200 bg-red-50 p-3">
                <code className="text-sm text-red-800">{execution.error}</code>
              </div>
            </SheetDataSection>
          )}

          {Boolean(execution.logs) &&
            Array.isArray(execution.logs) &&
            execution.logs.length > 0 && (
              <SheetDataSection label={t('Logs')}>
                <div className="mt-1 min-h-32 rounded-md bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                  <div className="px-3 py-2">
                    {execution.logs.map((log, index) => (
                      <div
                        key={index}
                        className="hover:bg-muted p-1 font-mono text-sm"
                      >
                        {Array.isArray(log) ? (
                          vertical ? (
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <Badge>{log[0]}</Badge>
                                <span className="opacity-60">
                                  {formatDate(log[1])}
                                </span>
                              </div>
                              <span>
                                <DataRender type="json" value={log[2]} />
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Badge>{log[0]}</Badge>
                              <span className="opacity-60">
                                {formatDate(log[1])}
                              </span>
                              <span>
                                <DataRender type="json" value={log[2]} />
                              </span>
                            </div>
                          )
                        ) : (
                          String(log)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </SheetDataSection>
            )}
        </div>
      </ScrollArea>
    );
  });

WorkerExecutionDetail.displayName = 'WorkerExecutionDetail';
