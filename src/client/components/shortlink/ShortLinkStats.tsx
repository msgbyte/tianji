import { useTranslation } from '@i18next-toolkit/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useMemo } from 'react';
import { SimplePieChart } from '../chart/SimplePieChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { AppRouterOutput } from '@/api/trpc';
import { LuActivity, LuGlobe, LuMonitor, LuCalendar } from 'react-icons/lu';
import { TimeEventChart, TimeEventChartData } from '../chart/TimeEventChart';

type StatsData = AppRouterOutput['shortlink']['stats'];

interface ShortLinkStatsProps {
  stats: StatsData;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const ShortLinkStats: React.FC<ShortLinkStatsProps> = React.memo(
  (props) => {
    const { stats } = props;
    const { t } = useTranslation();

    // Prepare time series data for TimeEventChart
    const timeSeriesData: TimeEventChartData[] = useMemo(() => {
      return stats.accessesByDate.map((item) => ({
        date: item.date,
        count: item.count,
      }));
    }, [stats.accessesByDate]);

    const timeSeriesChartConfig = useMemo(
      () => ({
        count: {
          label: t('Visits'),
          color: 'hsl(var(--chart-1))',
        },
      }),
      [t]
    );

    // Prepare data for charts
    const countryData = stats.accessesByCountry.map((item, index) => ({
      label: item.country || t('Unknown'),
      count: item._count.country,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const browserData = stats.accessesByBrowser.map((item, index) => ({
      label: item.browser || t('Unknown'),
      count: item._count.browser,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const deviceData = stats.accessesByDevice.map((item, index) => ({
      label: item.device || t('Unknown'),
      count: item._count.device,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const countryChartConfig = countryData.reduce(
      (acc, item, index) => {
        acc[item.label] = {
          label: item.label,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>
    );

    const browserChartConfig = browserData.reduce(
      (acc, item, index) => {
        acc[item.label] = {
          label: item.label,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>
    );

    const deviceChartConfig = deviceData.reduce(
      (acc, item, index) => {
        acc[item.label] = {
          label: item.label,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>
    );

    return (
      <div className="space-y-4">
        {/* Total Visits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LuActivity className="h-5 w-5" />
              {t('Total Visits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.totalAccesses.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('Total number of times this link has been accessed')}
            </p>
          </CardContent>
        </Card>

        {/* Last 30 Days Visits Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LuCalendar className="h-5 w-5" />
              {t('Last 30 Days Visits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <TimeEventChart
                className="h-[300px] w-full"
                data={timeSeriesData}
                unit="day"
                chartConfig={timeSeriesChartConfig}
                chartType="bar"
                hideLegend={true}
              />
            ) : (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                {t('No data')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LuGlobe className="h-4 w-4" />
                {t('Country Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <SimplePieChart
                  className="h-[250px] w-full"
                  data={countryData}
                  chartConfig={countryChartConfig}
                />
              ) : (
                <div className="text-muted-foreground flex h-[250px] items-center justify-center">
                  {t('No data')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browser Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LuMonitor className="h-4 w-4" />
                {t('Browser Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {browserData.length > 0 ? (
                <SimplePieChart
                  className="h-[250px] w-full"
                  data={browserData}
                  chartConfig={browserChartConfig}
                />
              ) : (
                <div className="text-muted-foreground flex h-[250px] items-center justify-center">
                  {t('No data')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LuMonitor className="h-4 w-4" />
                {t('Device Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <ChartContainer
                  className="h-[250px] w-full"
                  config={deviceChartConfig}
                >
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={8} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-muted-foreground flex h-[250px] items-center justify-center">
                  {t('No data')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

ShortLinkStats.displayName = 'ShortLinkStats';
