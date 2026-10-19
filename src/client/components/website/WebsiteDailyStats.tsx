import { getUserTimezone } from '@/api/model/user';
import { trpc } from '@/api/trpc';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { pickColorWithNum } from '@/utils/color';
import { useTranslation } from '@i18next-toolkit/react';
import { Spin } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';

interface WebsiteDailyStatsProps {
  workspaceId: string;
  websiteId: string;
  startAt: number;
  endAt: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebsiteDailyStats(props: WebsiteDailyStatsProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('DNU / DAU')}</DialogTitle>
          <DialogDescription>
            {t(
              'DNU: users whose first page view was on that day. DAU: unique users with a page view that day.'
            )}{' '}
            {t(
              'Uses tracked user IDs when available; otherwise estimated from anonymous visitor fingerprints.'
            )}
          </DialogDescription>
        </DialogHeader>
        {props.open && <DailyStatsContent {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function DailyStatsContent({
  workspaceId,
  websiteId,
  startAt,
  endAt,
}: WebsiteDailyStatsProps) {
  const { t } = useTranslation();
  const timezone = getUserTimezone();
  const { start, end } = useMemo(
    () => ({
      start: dayjs(startAt).startOf('day'),
      end: dayjs(Math.min(dayjs(endAt).endOf('day').valueOf(), Date.now())),
    }),
    [startAt, endAt]
  );
  const { data, isLoading, isError, refetch } = trpc.insights.query.useQuery({
    workspaceId,
    insightId: websiteId,
    insightType: 'website',
    metrics: [
      { name: '$first_visit', math: 'sessions', alias: 'dnu' },
      { name: '$page_view', math: 'sessions', alias: 'dau' },
    ],
    time: {
      startAt: start.valueOf(),
      endAt: end.valueOf(),
      unit: 'day',
      timezone,
    },
    filters: [],
    groups: [],
  });
  const rows = useMemo(() => {
    const dnu = data?.find((series) => series.alias === 'dnu')?.data ?? [];
    const dau = data?.find((series) => series.alias === 'dau')?.data ?? [];
    return dnu.map((point, index) => ({
      date: point.date.slice(0, 10),
      dnu: point.value,
      dau: dau[index]?.value ?? 0,
    }));
  }, [data]);
  const chartConfig = useMemo(
    () => ({
      dnu: { label: t('DNU'), color: pickColorWithNum(0) },
      dau: { label: t('DAU'), color: pickColorWithNum(1) },
    }),
    [t]
  );

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Spin />
      </div>
    );
  }
  if (isError) {
    return (
      <div
        role="alert"
        className="flex h-80 flex-col items-center justify-center gap-4"
      >
        <p>{t('Unable to load daily user statistics')}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('Retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-0 space-y-4 overflow-y-auto">
      <p className="text-muted-foreground text-sm">
        {start.format('YYYY-MM-DD')} – {end.format('YYYY-MM-DD')} · {timezone}
      </p>
      <TimeEventChart
        className="h-[320px] w-full"
        data={rows}
        unit="day"
        chartType="line"
        chartConfig={chartConfig}
        drawGradientArea={false}
        drawDashLine={false}
        yAxisDomain={[0, 'auto']}
        valueFormatter={(value) => value.toLocaleString()}
        tooltipLabelFormatter={(value) => value}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Date')}</TableHead>
              <TableHead className="text-right">{t('DNU')}</TableHead>
              <TableHead className="text-right">{t('DAU')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...rows].reverse().map((row) => (
              <TableRow key={row.date}>
                <TableCell>
                  {row.date}
                  {row.date === dayjs().format('YYYY-MM-DD') && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {t('Partial day')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.dnu.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.dau.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
