import { getUserTimezone } from '@/api/model/user';
import { trpc } from '@/api/trpc';
import {
  TimeEventChart,
  type TimeEventChartData,
} from '@/components/chart/TimeEventChart';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ChartConfig } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Empty, Spin } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { LuChartLine, LuChevronDown, LuChevronRight } from 'react-icons/lu';

interface WebsiteRetentionProps {
  workspaceId: string;
  websiteId: string;
  startAt: number;
  endAt: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const retentionDays = Array.from({ length: 31 }, (_, day) => day);

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
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-7xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
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
  const [showCohorts, setShowCohorts] = useState(false);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
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
        data
          .map(
            (row, index) =>
              [
                row.date,
                { label: row.date, color: pickColorWithNum(index + 1) },
              ] as const
          )
          .filter(([date]) => selectedCohorts.includes(date))
      ),
    }),
    [data, selectedCohorts, t]
  );
  const chartData = useMemo(
    () =>
      retentionDays.map((day) => {
        const point: TimeEventChartData = { date: String(day) };
        let totalUsers = 0;
        let retainedUsers = 0;

        data.forEach((row) => {
          const retained = row.retention[day];
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
  const totalUsers = data.reduce((total, row) => total + row.cohortSize, 0);
  const formatPercent = (value: number | undefined) =>
    value === undefined ? '-' : `${value.toFixed(1)}%`;
  const toggleCohort = (date: string, selected: boolean) => {
    setSelectedCohorts((current) =>
      selected
        ? [...current, date]
        : current.filter((selectedDate) => selectedDate !== date)
    );
  };

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
    <div className="min-h-0 space-y-4 overflow-y-auto">
      <TimeEventChart
        className="h-[360px] w-full"
        data={chartData}
        unit="day"
        chartType="line"
        chartConfig={chartConfig}
        drawGradientArea={false}
        drawDashLine={false}
        hideLegend
        yAxisDomain={[0, 100]}
        valueFormatter={(value) => `${value.toFixed(1)}%`}
        xAxisLabelFormatter={(value) => `${t('Day')} ${value}`}
        tooltipLabelFormatter={(value) => `${t('Day')} ${value}`}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="min-w-48">{t('Start date')}</TableHead>
              <TableHead className="min-w-24 text-right">
                {t('Users')}
              </TableHead>
              {retentionDays.map((day) => (
                <TableHead key={day} className="min-w-20 text-right">
                  {t('Day')} {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Button
                  aria-label={t(showCohorts ? 'Hide cohorts' : 'Show cohorts')}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowCohorts((shown) => !shown)}
                >
                  {showCohorts ? <LuChevronDown /> : <LuChevronRight />}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <Checkbox checked disabled aria-label={t('All start dates')} />
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: pickColorWithNum(0) }}
                  />
                  {t('All start dates')}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {totalUsers.toLocaleString()}
              </TableCell>
              {retentionDays.map((day) => (
                <TableCell key={day} className="text-right font-medium">
                  {formatPercent(chartData[day]?.all as number | undefined)}
                </TableCell>
              ))}
            </TableRow>
            {showCohorts &&
              data.map((row, index) => (
                <TableRow key={row.date}>
                  <TableCell />
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        aria-label={row.date}
                        checked={selectedCohorts.includes(row.date)}
                        onCheckedChange={(checked) =>
                          toggleCohort(row.date, checked === true)
                        }
                      />
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: pickColorWithNum(index + 1) }}
                      />
                      {row.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.cohortSize.toLocaleString()}
                  </TableCell>
                  {retentionDays.map((day) => {
                    const retained = row.retention[day];
                    const value =
                      retained === null || row.cohortSize === 0
                        ? undefined
                        : (retained / row.cohortSize) * 100;

                    return (
                      <TableCell key={day} className="text-right">
                        {formatPercent(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
