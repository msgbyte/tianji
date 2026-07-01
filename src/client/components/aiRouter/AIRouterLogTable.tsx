import { AppRouterOutput, trpc } from '@/api/trpc';
import { AIGatewayLogDetail } from '@/components/aiGateway/AIGatewayLogDetail';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { Link } from '@tanstack/react-router';
import { Empty } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';

interface AIRouterLogTableProps {
  routerId: string;
  gateways?: Array<{
    id: string;
    name: string;
  }>;
}

type AIRouterLogItem = AppRouterOutput['aiRouter']['logs']['items'][number];
type SelectedGatewayLog = {
  gatewayId: string;
  logId: string;
};

export const AIRouterLogTable: React.FC<AIRouterLogTableProps> = React.memo(
  ({ gateways = [], routerId }) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const [selectedGatewayLog, setSelectedGatewayLog] =
      useState<SelectedGatewayLog | null>(null);
    const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      isLoading,
      refetch,
    } = trpc.aiRouter.logs.useInfiniteQuery(
      {
        workspaceId,
        routerId,
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

    const {
      data: gatewayLogData,
      isFetching: isFetchingGatewayLog,
      isLoading: isLoadingGatewayLog,
    } = trpc.aiGateway.logs.useInfiniteQuery(
      {
        workspaceId,
        gatewayId: selectedGatewayLog?.gatewayId ?? '',
        logId: selectedGatewayLog?.logId,
        limit: 1,
      },
      {
        enabled: Boolean(selectedGatewayLog),
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

    const items = useMemo(
      () => data?.pages.flatMap((page) => page.items) ?? [],
      [data]
    );
    const gatewayNameById = useMemo(
      () => new Map(gateways.map((gateway) => [gateway.id, gateway.name])),
      [gateways]
    );
    const selectedGatewayLogItem = useMemo(
      () => gatewayLogData?.pages.flatMap((page) => page.items)[0] ?? null,
      [gatewayLogData]
    );

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            Icon={LuRefreshCw}
            loading={isFetching && !isFetchingNextPage}
            onClick={() => void refetch()}
          >
            {t('Refresh')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Protocol')}</TableHead>
                <TableHead className="text-right">{t('Attempts')}</TableHead>
                <TableHead>{t('Final Gateway')}</TableHead>
                <TableHead>{t('Final Gateway Log')}</TableHead>
                <TableHead className="text-right">{t('Duration')}</TableHead>
                <TableHead>{t('Created At')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {t('No logs yet.')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <AIRouterLogRow
                    key={item.id}
                    item={item}
                    gatewayName={gatewayNameById.get(
                      item.finalGatewayId ?? ''
                    )}
                    onGatewayLogSelect={setSelectedGatewayLog}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {hasNextPage && (
          <Button
            variant="outline"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('Load More')}
          </Button>
        )}

        <Sheet
          open={Boolean(selectedGatewayLog)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedGatewayLog(null);
            }
          }}
        >
          <SheetContent className="flex flex-col sm:max-w-[640px]">
            <SheetHeader>
              <SheetTitle>{t('Gateway Logs')}</SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 py-4 pr-2">
              {selectedGatewayLogItem ? (
                <AIGatewayLogDetail item={selectedGatewayLogItem} />
              ) : isFetchingGatewayLog || isLoadingGatewayLog ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  {t('Loading...')}
                </div>
              ) : (
                <Empty />
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
);

AIRouterLogTable.displayName = 'AIRouterLogTable';

function AIRouterLogRow({
  item,
  gatewayName,
  onGatewayLogSelect,
}: {
  item: AIRouterLogItem;
  gatewayName?: string;
  onGatewayLogSelect: (log: SelectedGatewayLog) => void;
}) {
  const finalGatewayName = gatewayName ?? item.finalGatewayId;

  return (
    <TableRow>
      <TableCell>
        <span className="rounded border px-1.5 py-0.5 text-xs">
          {item.status}
        </span>
      </TableCell>
      <TableCell className="font-mono text-xs">{item.protocol}</TableCell>
      <TableCell className="text-right">{item.attemptCount}</TableCell>
      <TableCell className="max-w-[180px] truncate">
        {item.finalGatewayId ? (
          <Link
            to="/aiGateway/$gatewayId"
            params={{ gatewayId: item.finalGatewayId }}
            className="text-primary block truncate hover:underline"
          >
            {finalGatewayName}
          </Link>
        ) : (
          <span className="opacity-40">-</span>
        )}
      </TableCell>
      <TableCell className="max-w-[180px] truncate">
        {item.finalGatewayId && item.finalGatewayLogId ? (
          <button
            type="button"
            className="text-primary max-w-full truncate font-mono text-xs hover:underline"
            onClick={() =>
              onGatewayLogSelect({
                gatewayId: item.finalGatewayId!,
                logId: item.finalGatewayLogId!,
              })
            }
          >
            {item.finalGatewayLogId}
          </button>
        ) : (
          <span className="opacity-40">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">{item.duration}ms</TableCell>
      <TableCell className="whitespace-nowrap">
        {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
      </TableCell>
    </TableRow>
  );
}
