import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetDataSection } from '@/components/ui/sheet';
import dayjs from 'dayjs';
import { cn } from '@/utils/style';

interface WorkerExecutionDetailProps {
  vertical?: boolean;
  execution: {
    id?: string;
    status: string;
    duration?: number | null;
    memoryUsed?: number | null;
    cpuTime?: number | null;
    createdAt: string;
    error?: string | null;
    responsePayload?: unknown;
    logs?: unknown;
  };
}

export const WorkerExecutionDetail: React.FC<WorkerExecutionDetailProps> =
  React.memo((props) => {
    const { vertical = false, execution } = props;
    const { t } = useTranslation();

    const response = useMemo<string>(() => {
      try {
        if (typeof execution.responsePayload === 'string') {
          return execution.responsePayload;
        }
        return JSON.stringify(execution.responsePayload as any, null, 2);
      } catch {
        return '[Invalid JSON]';
      }
    }, [execution.responsePayload]);

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

          {execution.responsePayload !== null &&
            execution.responsePayload !== undefined && (
              <SheetDataSection label={t('Response')}>
                <div className="bg-muted mt-1 max-h-[400px] overflow-auto rounded-md p-3">
                  <code className="text-sm">{response}</code>
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
                <ScrollArea className="mt-1 h-32 rounded-md bg-gray-900 p-3 text-gray-100">
                  {execution.logs.map((log: any, index: number) => (
                    <div key={index} className="font-mono text-sm">
                      {String(log)}
                    </div>
                  ))}
                </ScrollArea>
              </SheetDataSection>
            )}
        </div>
      </ScrollArea>
    );
  });

WorkerExecutionDetail.displayName = 'WorkerExecutionDetail';
