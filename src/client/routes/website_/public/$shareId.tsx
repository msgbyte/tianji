import React, { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { LuRefreshCcw, LuShare2 } from 'react-icons/lu';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import type { DateUnit } from '@tianji/shared';
import type { ChartConfig } from '@/components/ui/chart';
import { trpc } from '@/api/trpc';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { ErrorTip } from '@/components/ErrorTip';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MetricCard } from '@/components/MetricCard';
import { formatNumber, formatShortTime } from '@/utils/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fillPageviewsTrend } from '@/utils/pageviews';

const RANGE_OPTIONS = ['realtime', '24h', '7d', '30d', '90d'] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

export const Route = createFileRoute('/website/public/$shareId')({
  component: PageComponent,
});

function PageComponent() {
  const { shareId } = Route.useParams<{ shareId: string }>();
  const { t } = useTranslation();
  const [range, setRange] = useState<RangeOption>('24h');

  const chartConfig = useMemo(() => {
    return {
      pageviews: {
        value: {
          label: t('views'),
          theme: {
            light: 'var(--chart-1)',
            dark: 'var(--chart-1)',
          },
        },
      } satisfies ChartConfig,
      events: {
        value: {
          label: t('events'),
          theme: {
            light: 'var(--chart-2)',
            dark: 'var(--chart-2)',
          },
        },
      } satisfies ChartConfig,
    };
  }, [t]);

  const {
    data: website,
    isLoading: isWebsiteLoading,
    error: websiteError,
  } = trpc.website.getPublicInfoByShareId.useQuery({ shareId });

  const statsQuery = trpc.website.getPublicStatsByShareId.useQuery(
    { shareId, range },
    { enabled: !!website }
  );
  const stats = statsQuery.data;

  const metricsUrl =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'url', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsReferrer =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'referrer', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsBrowser =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'browser', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsOs =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'os', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsDevice =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'device', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsCountry =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'country', range },
      { enabled: !!website }
    ).data ?? [];
  const metricsEvent =
    trpc.website.getPublicMetricsByShareId.useQuery(
      { shareId, type: 'event', range },
      { enabled: !!website }
    ).data ?? [];

  const isLoading = isWebsiteLoading || (!website && !websiteError);

  const pageviewsSeries = useMemo(() => {
    const trend = stats?.pageviews_trend ?? [];
    return fillPageviewsTrend(range, trend);
  }, [range, stats?.pageviews_trend]);

  const metricsTables = useMemo(
    () => [
      { title: [t('Pages'), t('Views')], rows: metricsUrl },
      { title: [t('Referrers'), t('Views')], rows: metricsReferrer },
      { title: [t('Browser'), t('Visitors')], rows: metricsBrowser },
      { title: [t('OS'), t('Visitors')], rows: metricsOs },
      { title: [t('Devices'), t('Visitors')], rows: metricsDevice },
      { title: [t('Country or Region'), t('Visitors')], rows: metricsCountry },
    ],
    [
      metricsUrl,
      metricsReferrer,
      metricsBrowser,
      metricsOs,
      metricsDevice,
      metricsCountry,
      t,
    ]
  );

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const value = origin
      ? `${origin}/website/public/${shareId}`
      : `/website/public/${shareId}`;
    copy(value);
    toast.success(t('Public share link copied to clipboard'));
  };

  const eventsChartData = useMemo(
    () =>
      metricsEvent.map((item) => ({
        date: item.x ?? t('(None)'),
        value: item.y,
      })),
    [metricsEvent, t]
  );

  const chartUnit = useMemo<DateUnit>(() => {
    switch (range) {
      case 'realtime':
        return 'minute';
      case '24h':
        return 'hour';
      case '7d':
      case '30d':
      case '90d':
      default:
        return 'day';
    }
  }, [range]);

  if (isLoading) {
    return <Loading />;
  }

  if (websiteError?.data?.code === 'NOT_FOUND' || !website) {
    return <NotFoundTip />;
  }

  if (websiteError) {
    return <ErrorTip />;
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-2xl font-bold">
              {website.name}
            </CardTitle>
            {website.domain && (
              <p className="text-muted-foreground break-all text-sm">
                {website.domain}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={range}
              onValueChange={(value) => setRange(value as RangeOption)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('Last 24 hours')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">{t('Realtime')}</SelectItem>
                <SelectItem value="24h">{t('Last 24 hours')}</SelectItem>
                <SelectItem value="7d">{t('Last 7 days')}</SelectItem>
                <SelectItem value="30d">{t('Last 30 days')}</SelectItem>
                <SelectItem value="90d">{t('Last 90 days')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              Icon={LuRefreshCcw}
              onClick={() => statsQuery.refetch()}
              disabled={statsQuery.isLoading}
              aria-label={t('Refresh')}
            />

            <Button
              variant="outline"
              size="icon"
              Icon={LuShare2}
              onClick={handleCopyLink}
              aria-label={t('Copy share link')}
            />
          </div>
        </CardHeader>
      </Card>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 pr-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricStat
              label={t('Views')}
              value={stats?.pageviews.value ?? 0}
              prev={stats?.pageviews.prev ?? 0}
            />
            <MetricStat
              label={t('Visitors')}
              value={stats?.visitors.value ?? 0}
              prev={stats?.visitors.prev ?? 0}
            />
            <MetricStat
              label={t('Bounce Rate')}
              value={stats?.bounce_rate.value ?? 0}
              prev={stats?.bounce_rate.prev ?? 0}
              format={(n) => `${formatNumber(n)}%`}
              reverseColors
            />
            <MetricStat
              label={t('Average Visit Time')}
              value={stats?.average_visit_duration.value ?? 0}
              prev={stats?.average_visit_duration.prev ?? 0}
              format={(n) =>
                `${formatShortTime(Math.max(Math.round(n), 0), ['m', 's'], ' ')}`
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('Views')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto pt-0">
              {pageviewsSeries.length === 0 ? (
                <EmptyState>{t('No data')}</EmptyState>
              ) : (
                <TimeEventChart
                  className="h-72 w-full"
                  data={pageviewsSeries}
                  unit={chartUnit}
                  chartConfig={chartConfig.pageviews}
                  valueFormatter={(value) => formatNumber(value)}
                  xAxisLabelFormatter={(value) =>
                    dayjs(value).format('MM/DD HH:mm')
                  }
                  tooltipLabelFormatter={(value) =>
                    dayjs(value).format('YYYY-MM-DD HH:mm')
                  }
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metricsTables.map((table, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {table.title[0]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto pt-0">
                  <MetricsList rows={table.rows} labelY={table.title[1]} />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('Events')}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto pt-0">
                {eventsChartData.length === 0 ? (
                  <EmptyState>{t('No data')}</EmptyState>
                ) : (
                  <TimeEventChart
                    className="h-72 w-full"
                    data={eventsChartData}
                    unit={chartUnit}
                    chartConfig={chartConfig.events}
                    chartType="bar"
                    valueFormatter={(value) => formatNumber(value)}
                    xAxisLabelFormatter={(value) => String(value)}
                    tooltipLabelFormatter={(value) => String(value)}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Top countries')}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto pt-0">
                <MetricsList
                  rows={metricsCountry.slice(0, 10)}
                  labelY={t('Visitors')}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('Events list')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto pt-0">
              <MetricsList rows={metricsEvent} labelY={t('Actions')} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

interface MetricStatProps {
  label: string;
  value: number;
  prev: number;
  format?: (value: number) => string;
  reverseColors?: boolean;
}

function MetricStat(props: MetricStatProps) {
  const { label, value, prev, format, reverseColors } = props;

  return (
    <Card>
      <CardContent className="p-4">
        <MetricCard
          label={label}
          value={value}
          prev={prev}
          change={value - prev}
          format={format}
          reverseColors={reverseColors}
        />
      </CardContent>
    </Card>
  );
}

function MetricsList({
  rows,
  labelY,
}: {
  rows: { x: string | null; y: number; ratio?: number }[];
  labelY: string;
}) {
  const { t } = useTranslation();
  const total = rows.reduce((acc, item) => acc + Number(item.y) || 0, 0);

  if (rows.length === 0) {
    return <div className="text-muted-foreground text-sm">{t('No data')}</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground text-xs">
          <th className="pb-1 text-left">{t('Item')}</th>
          <th className="pb-1 text-right">{labelY}</th>
          <th className="pb-1 text-right">{t('Percentage')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const ratio = row.ratio ?? (total > 0 ? Number(row.y) / total : 0);

          return (
            <tr key={`${row.x ?? 'unknown'}-${row.y}`} className="border-t">
              <td className="py-1">
                {row.x ?? (
                  <span className="italic opacity-60">{t('(None)')}</span>
                )}
              </td>
              <td className="py-1 text-right">{formatNumber(row.y)}</td>
              <td className="py-1 text-right">{(ratio * 100).toFixed(0)}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
    {children}
  </div>
);
