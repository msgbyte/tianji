import { AppRouterOutput, trpc } from '@/api/trpc';
import { Button } from '@/components/ui/button';
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
import dayjs from 'dayjs';
import React, { useMemo } from 'react';

interface AIRouterLogTableProps {
  routerId: string;
}

type AIRouterLogItem = AppRouterOutput['aiRouter']['logs']['items'][number];

export const AIRouterLogTable: React.FC<AIRouterLogTableProps> = React.memo(
  ({ routerId }) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
      trpc.aiRouter.logs.useInfiniteQuery(
        {
          workspaceId,
          routerId,
          limit: 20,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
      );

    const items = useMemo(
      () => data?.pages.flatMap((page) => page.items) ?? [],
      [data]
    );

    return (
      <div className="space-y-3">
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
                  <AIRouterLogRow key={item.id} item={item} />
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
      </div>
    );
  }
);

AIRouterLogTable.displayName = 'AIRouterLogTable';

function AIRouterLogRow({ item }: { item: AIRouterLogItem }) {
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
        {item.finalGatewayId ?? <span className="opacity-40">-</span>}
      </TableCell>
      <TableCell className="max-w-[180px] truncate">
        {item.finalGatewayLogId ?? <span className="opacity-40">-</span>}
      </TableCell>
      <TableCell className="text-right">{item.duration}ms</TableCell>
      <TableCell className="whitespace-nowrap">
        {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
      </TableCell>
    </TableRow>
  );
}
