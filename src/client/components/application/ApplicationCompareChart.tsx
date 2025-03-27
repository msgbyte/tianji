import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useEffect, useMemo } from 'react';
import { useState } from 'react';
import {
  TimeEventChart,
  useTimeEventChartConfig,
} from '../chart/TimeEventChart';
import { Empty } from 'antd';
import { t } from '@i18next-toolkit/react';
import { DelayRender } from '../DelayRender';
import { sortBy } from 'lodash-es';

export const ApplicationCompareChart: React.FC<{
  applications: {
    applicationId: string;
    applicationName: string;
    storeType: 'appstore' | 'googleplay';

    /**
     * NOTICE: if not pass this field, the data maybe not much right because store id maybe not same
     */
    storeId?: string;
  }[];
  field: 'downloads' | 'score' | 'ratingCount' | 'reviews' | 'size';
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const trpcUtils = trpc.useUtils();
  const { startAt, endAt } = useMemo(() => {
    return {
      startAt: dayjs().subtract(1, 'month').startOf('date').valueOf(),
      endAt: dayjs().endOf('date').valueOf(),
    };
  }, []);
  const [chartData, setChartData] = useState<
    {
      date: string;
    }[]
  >([]);

  useEffect(() => {
    Promise.all(
      props.applications.map((app) => {
        return trpcUtils.application.storeInfoHistory
          .fetch({
            workspaceId,
            applicationId: app.applicationId,
            storeType: app.storeType,
            storeId: app.storeId,
            startAt,
            endAt,
          })
          .then((res) => {
            return res.map((info) => ({
              applicationId: app.applicationId,
              applicationName: app.applicationName,
              downloads: info.downloads,
              ratingCount: info.ratingCount,
              reviews: info.reviews,
              score: info.score,
              size: info.size,
              date: dayjs(info.createdAt)
                .startOf('date')
                .format('YYYY-MM-DD HH:mm:ss'),
            }));
          });
      })
    ).then((res) => {
      // Process and merge data from all applications
      const mergedData = new Map<
        string,
        { date: string; [key: string]: any }
      >();

      // Flatten and process all application data
      res.forEach((appData) => {
        appData.forEach((item) => {
          const dateStr = item.date;

          if (!mergedData.has(dateStr)) {
            mergedData.set(dateStr, { date: item.date });
          }

          // Add the field value for this application
          const fieldValue = item[props.field];
          if (fieldValue !== undefined && fieldValue !== null) {
            mergedData.get(dateStr)![item.applicationName] = fieldValue;
          }
        });
      });

      setChartData(sortBy(Array.from(mergedData.values()), 'date'));
    });
  }, [props.applications]);

  const chartConfig = useTimeEventChartConfig(chartData);

  if (chartData.length === 0) {
    return (
      <div className="h-[400px]">
        <DelayRender>
          <Empty description={t('Please select any application to compare')} />
        </DelayRender>
      </div>
    );
  }

  return (
    <TimeEventChart
      className="h-[400px] w-full"
      data={chartData}
      unit="day"
      chartConfig={chartConfig}
      drawDashLine={false}
      drawGradientArea={false}
      isTrendingMode={true}
      showDifference={true}
      chartType="line"
    />
  );
});
ApplicationCompareChart.displayName = 'ApplicationCompareChart';
