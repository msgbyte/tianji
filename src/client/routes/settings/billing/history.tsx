import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { LuRefreshCw } from 'react-icons/lu';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrentWorkspaceId } from '../../../store/user';
import { trpc } from '../../../api/trpc';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils/style';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationControls } from '@/components/PaginationControls';

export const Route = createFileRoute('/settings/billing/history')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const { data, isLoading, isFetching, refetch } =
    trpc.billing.creditBills.useQuery(
      {
        workspaceId,
        page,
        pageSize,
      },
      {
        enabled: Boolean(workspaceId),
      }
    );

  const bills = useMemo(() => data?.list ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Credit Records')}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {t('Per page {{count}}', { count: pageSize })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map((sizeOption) => (
                    <SelectItem key={sizeOption} value={String(sizeOption)}>
                      {t('Per page {{count}}', { count: sizeOption })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <LuRefreshCw
                  className={cn('h-4 w-4', isFetching && 'animate-spin')}
                />
              </Button>
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="space-y-3">
          {isLoading && bills.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              {t('Loading...')}
            </div>
          ) : bills.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              {t('No credit activity yet.')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">{t('Time')}</TableHead>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead className="w-32 text-right">
                    {t('Amount')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.amount >= 0 ? 'secondary' : 'destructive'}
                        className="capitalize"
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={cn(
                          item.amount >= 0
                            ? 'text-emerald-600'
                            : 'text-destructive'
                        )}
                      >
                        {item.amount >= 0 ? '+' : ''}
                        {Number(item.amount).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {total > 0 && (
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="text-muted-foreground text-sm">
                {t('Page {{page}} of {{total}} • Total {{count}} records', {
                  page,
                  total: totalPages,
                  count: total,
                })}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={isFetching}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
