import { getUserTimezone } from '@/api/model/user';
import { trpc } from '@/api/trpc';
import {
  TimeEventChart,
  type TimeEventChartData,
} from '@/components/chart/TimeEventChart';
import { Button } from '@/components/ui/button';
import type { ChartConfig } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { pickColorWithNum } from '@/utils/color';
import { useTranslation } from '@i18next-toolkit/react';
import { Empty, Spin } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { LuChartLine } from 'react-icons/lu';

interface WebsiteRetentionProps {
  workspaceId: string;
  websiteId: string;
  startAt: number;
  endAt: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const retentionDays = [
  [0, null],
  [1, 'd1'],
  [3, 'd3'],
  [5, 'd5'],
  [7, 'd7'],
  [14, 'd14'],
] as const;

export function WebsiteRetention(props: WebsiteRetentionProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open ?? internalOpen;
  const setOpen = props.onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.showTrigger !== false && (
        <DialogTrigger asChild>
          <Button variant="outline" Icon={LuChartLine}>
            {t('Visitor retention')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('Visitor retention')}</DialogTitle>
          <DialogDescription>
            {t('Estimated from anonymous visitor fingerprints')}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <WebsiteRetentionChart
            workspaceId={props.workspaceId}
            websiteId={props.websiteId}
            startAt={props.startAt}
            endAt={props.endAt}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WebsiteRetentionChart({
  workspaceId,
  websiteId,
  startAt,
  endAt,
}: WebsiteRetentionProps) {
  const { t } = useTranslation();
  const selectedEnd = dayjs(endAt);
  const completeEnd = selectedEnd.isBefore(dayjs(), 'day')
    ? selectedEnd.endOf('day')
    : dayjs().subtract(1, 'day').endOf('day');
  const selectedStart = dayjs(startAt).startOf('day');
  const cohortStart =
    completeEnd.diff(selectedStart, 'day') < 30
      ? completeEnd.subtract(30, 'day').startOf('day')
      : selectedStart;
  const { data = [], isLoading } = trpc.website.retention.useQuery({
    workspaceId,
    websiteId,
    startAt: cohortStart.valueOf(),
    endAt: completeEnd.valueOf(),
    timezone: getUserTimezone(),
  });

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      all: { label: t('All start dates'), color: pickColorWithNum(0) },
      ...Object.fromEntries(
        data.map((row, index) => [
          row.date,
          { label: row.date, color: pickColorWithNum(index + 1) },
        ])
      ),
    }),
    [data, t]
  );
  const chartData = useMemo(
    () =>
      retentionDays.map(([day, key]) => {
        const point: TimeEventChartData = { date: String(day) };
        let totalUsers = 0;
        let retainedUsers = 0;

        data.forEach((row) => {
          const retained = key === null ? row.cohortSize : row[key];
          if (retained === null) {
            return;
          }

          point[row.date] = row.cohortSize
            ? (retained / row.cohortSize) * 100
            : 0;
          retainedUsers += retained;
          totalUsers += row.cohortSize;
        });

        if (totalUsers > 0) {
          point.all = (retainedUsers / totalUsers) * 100;
        }

        return point;
      }),
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Empty />
      </div>
    );
  }

  return (
    <TimeEventChart
      className="h-[420px] w-full"
      data={chartData}
      unit="day"
      chartType="line"
      chartConfig={chartConfig}
      drawGradientArea={false}
      yAxisDomain={[0, 100]}
      valueFormatter={(value) => `${value.toFixed(1)}%`}
      xAxisLabelFormatter={(value) => `${t('Day')} ${value}`}
      tooltipLabelFormatter={(value) => `${t('Day')} ${value}`}
    />
  );
}
